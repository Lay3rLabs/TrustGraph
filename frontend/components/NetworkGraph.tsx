'use client'

import '@react-sigma/core/lib/style.css'

import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
  useCamera,
  useLoadGraph,
  useRegisterEvents,
  useSetSettings,
  useSigma,
} from '@react-sigma/core'
import { useLayoutCircular } from '@react-sigma/layout-circular'
import { useWorkerLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2'
import {
  DEFAULT_EDGE_CURVATURE,
  EdgeCurvedArrowProgram,
  indexParallelEdgesIndex,
} from '@sigma/edge-curve'
import { MultiDirectedGraph } from 'graphology'
import { circular } from 'graphology-layout'
import forceAtlas2, { ForceAtlas2Settings } from 'graphology-layout-forceatlas2'
import { CircleDashed, LoaderCircle, Waypoints } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { EdgeArrowProgram } from 'sigma/rendering'
import { NodeDisplayData } from 'sigma/types'
import { animateNodes } from 'sigma/utils'
import { Hex } from 'viem'

import { useNetwork } from '@/contexts/NetworkContext'
import { useBatchEnsQuery } from '@/hooks/useEns'
import { useUpdatingRef } from '@/hooks/useUpdatingRef'
import { NetworkGraphEdge, NetworkGraphNode } from '@/lib/network'
import {
  NetworkGraphHoverState,
  NetworkGraphManager,
} from '@/lib/NetworkGraphManager'
import { areAddressesEqual, cn, formatBigNumber } from '@/lib/utils'

const forceAtlas2SettingsOverrides: ForceAtlas2Settings = {
  // Bind nodes more tightly together.
  gravity: 0.5,

  // Push hubs outwards to highlight them (disrupts spatial balance)
  // outboundAttractionDistribution: true,
}
const forceAtlas2Duration = 250

// https://github.com/jacomyal/sigma.js/blob/main/packages/storybook/stories/3-additional-packages/edge-curve/parallel-edges.ts
const getCurvature = (index: number, maxIndex: number): number => {
  if (maxIndex <= 0) throw new Error('Invalid maxIndex')
  if (index < 0) return -getCurvature(-index, maxIndex)
  const amplitude = 3.5
  const maxCurvature =
    amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE
  return (maxCurvature * index) / maxIndex
}

// Helper function to get color based on value (0-100)
const getColorFromValue = (value: number): string => {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value))

  // Purple -> Blue -> Cyan
  // if (clampedValue <= 50) {
  //   // Purple to Blue (0-50)
  //   const ratio = clampedValue / 50
  //   const red = Math.round(128 * (1 - ratio) + 65 * ratio)
  //   const green = Math.round(0 * (1 - ratio) + 105 * ratio)
  //   const blue = Math.round(128 * (1 - ratio) + 225 * ratio)
  //   return `rgb(${red}, ${green}, ${blue})`
  // } else {
  //   // Blue to Cyan (50-100)
  //   const ratio = (clampedValue - 50) / 50
  //   const red = Math.round(65 * (1 - ratio) + 0 * ratio)
  //   const green = Math.round(105 * (1 - ratio) + 206 * ratio)
  //   const blue = Math.round(225 * (1 - ratio) + 209 * ratio)
  //   return `rgb(${red}, ${green}, ${blue})`
  // }

  // Simplified viridis-like gradient: Dark Blue → Teal → Yellow
  // const ratio = clampedValue / 100
  // if (ratio < 0.5) {
  //   const t = ratio * 2
  //   const red = Math.round(68 * (1 - t) + 35 * t)
  //   const green = Math.round(1 * (1 - t) + 139 * t)
  //   const blue = Math.round(84 * (1 - t) + 140 * t)
  //   return `rgb(${red}, ${green}, ${blue})`
  // } else {
  //   const t = (ratio - 0.5) * 2
  //   const red = Math.round(35 * (1 - t) + 253 * t)
  //   const green = Math.round(139 * (1 - t) + 231 * t)
  //   const blue = Math.round(140 * (1 - t) + 37 * t)
  //   return `rgb(${red}, ${green}, ${blue})`
  // }

  // Light blue to deep blue
  const ratio = clampedValue / 100
  const red = Math.round(173 * (1 - ratio) + 25 * ratio)
  const green = Math.round(216 * (1 - ratio) + 25 * ratio)
  const blue = Math.round(230 * (1 - ratio) + 112 * ratio)
  return `rgb(${red}, ${green}, ${blue})`

  // Grey
  return '#888888'
}

export interface NetworkGraphProps {
  /** Only show attestations connected to this address. */
  onlyAddress?: Hex
  className?: string
  /** Initial zoom level. > 1.0 zooms out, < 1.0 zooms in. Defaults to 1.25. */
  initialZoom?: number
}

export function NetworkGraph({
  onlyAddress,
  className,
  initialZoom = 1.25,
}: NetworkGraphProps) {
  const router = useRouter()

  const { isLoading, error, accountData, attestationsData, isTrustedSeed } =
    useNetwork()

  // Load ENS data
  const { data: ensData } = useBatchEnsQuery(
    accountData.map((account) => account.account) || []
  )

  const [showCursor, setShowCursor] = useState(false)

  const [isGraphFirstLoad, setIsGraphFirstLoad] = useState(true)
  const [graph] = useState(
    () => new MultiDirectedGraph<NetworkGraphNode, NetworkGraphEdge>()
  )

  // Update graph from data.
  useEffect(() => {
    if (!accountData || !attestationsData) {
      return
    }

    const maxValue = Number(
      accountData.reduce(
        (max, { value }) => (BigInt(value) > max ? BigInt(value) : max),
        0n
      )
    )
    const minValue = Number(
      accountData.reduce(
        (min, { value }) => (BigInt(value) < min ? BigInt(value) : min),
        BigInt(maxValue)
      )
    )

    const minNodeSize = 8
    const maxNodeSize = 16

    // const minConfidence = 0
    // const maxConfidence = 100
    // const minEdgeSize = 2
    // const maxEdgeSize = 8
    const edgeSize = 1

    // Skip attestations that are not connected to the onlyAddress, if set.
    const attestations = attestationsData.filter(
      (attestation) =>
        !onlyAddress ||
        areAddressesEqual(attestation.attester, onlyAddress) ||
        areAddressesEqual(attestation.recipient, onlyAddress)
    )

    for (const { account, value, sent, received } of accountData) {
      // Skip accounts not included in the graph.
      if (
        !attestations.some(
          (attestation) =>
            areAddressesEqual(attestation.attester, account) ||
            areAddressesEqual(attestation.recipient, account)
        )
      ) {
        continue
      }

      // Normalize value to 0-100 scale
      const normalizedValue =
        maxValue === minValue
          ? 50 // Default to middle if all values are the same
          : ((Number(value) - minValue) / (maxValue - minValue)) * 100

      const ensName = ensData?.[account]?.name
      const href = `/account/${ensName || account}`
      router.prefetch(href)

      const nodeKey = account.toLowerCase()
      const node: Omit<NetworkGraphNode, 'x' | 'y'> = {
        href,
        label:
          (ensName || `${account.slice(0, 6)}...${account.slice(-4)}`) +
          (isTrustedSeed(account) ? ' 🌱' : ''),
        value: BigInt(value),
        sent,
        received,
        // Set size to relative value, scaled to a range
        size:
          minNodeSize +
          ((Number(value) - minValue) / (maxValue - minValue)) *
            (maxNodeSize - minNodeSize),
        // Set node color gradient from red to yellow to green based on value
        color: getColorFromValue(normalizedValue),
      }

      if (!graph.hasNode(nodeKey)) {
        graph.addNode(nodeKey, {
          ...node,
          x: 0,
          y: 0,
        })
      } else {
        graph.mergeNodeAttributes(nodeKey, node)
      }
    }

    for (const attestation of attestations) {
      // const confidence = Number(attestation.decodedData?.confidence || 50)
      // const size =
      //   minEdgeSize +
      //   ((confidence - minConfidence) / (maxConfidence - minConfidence)) *
      //     (maxEdgeSize - minEdgeSize)
      const edgeKey = attestation.uid
      const edge: NetworkGraphEdge = {
        href: `/attestations/${attestation.uid}`,
        label: attestation.decodedData?.confidence?.toString() || 'unknown',
        size: edgeSize,
      }
      if (!graph.hasEdge(edgeKey)) {
        graph.addEdgeWithKey(
          edgeKey,
          attestation.attester.toLowerCase(),
          attestation.recipient.toLowerCase(),
          edge
        )
      } else {
        graph.mergeEdgeAttributes(edgeKey, edge)
      }
    }

    // Curve parallel edges so they're all visible / not overlapping
    // https://github.com/jacomyal/sigma.js/blob/main/packages/storybook/stories/3-additional-packages/edge-curve/parallel-edges.ts

    // Use dedicated helper to identify parallel edges:
    indexParallelEdgesIndex(graph, {
      edgeIndexAttribute: 'parallelIndex',
      edgeMinIndexAttribute: 'parallelMinIndex',
      edgeMaxIndexAttribute: 'parallelMaxIndex',
    })

    // Adapt types and curvature of parallel edges for rendering:
    graph.forEachEdge(
      (
        edge,
        {
          parallelIndex,
          parallelMinIndex,
          parallelMaxIndex,
        }:
          | {
              parallelIndex: number
              parallelMinIndex?: number
              parallelMaxIndex: number
            }
          | {
              parallelIndex?: null
              parallelMinIndex?: null
              parallelMaxIndex?: null
            }
      ) => {
        if (typeof parallelMinIndex === 'number') {
          graph.mergeEdgeAttributes(edge, {
            type: parallelIndex ? 'curved' : 'straight',
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          })
        } else if (typeof parallelIndex === 'number') {
          graph.mergeEdgeAttributes(edge, {
            type: 'curved',
            curvature: getCurvature(parallelIndex, parallelMaxIndex),
          })
        } else {
          graph.setEdgeAttribute(edge, 'type', 'straight')
        }
      }
    )

    // Only run layout on first load.
    if (isGraphFirstLoad) {
      circular.assign(graph, {
        scale: 100,
      })

      setIsGraphFirstLoad(false)

      // // Initialize force atlas 2 layout.
      // new Promise<void>(async (resolve) => {
      //   const layout = new ForceAtlas2LayoutWorker(graph, {
      //     settings: {
      //       ...forceAtlas2.inferSettings(graph),
      //       ...forceAtlas2SettingsOverrides,
      //     },
      //   })

      //   layout.start()
      //   await new Promise<void>((resolve) =>
      //     setTimeout(resolve, forceAtlas2Duration)
      //   )
      //   layout.stop()
      //   layout.kill()

      //   setIsGraphFirstLoad(false)

      //   resolve()
      // })
    }
  }, [accountData, attestationsData, isTrustedSeed, ensData])

  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden isolate',
        className
      )}
    >
      {isLoading || isGraphFirstLoad ? (
        <div className="w-full h-full flex justify-center items-center border border-border rounded-md p-4">
          <LoaderCircle size={24} className="animate-spin" />
        </div>
      ) : error || !accountData || !attestationsData ? (
        <div className="w-full h-full flex justify-center items-center border border-destructive rounded-md p-4">
          <p className="text-sm text-destructive">
            Error: {error || 'No data'}
          </p>
        </div>
      ) : (
        graph && (
          <SigmaContainer
            className={cn(
              'border border-border rounded-md',
              showCursor && 'cursor-pointer'
            )}
            settings={{
              renderLabels: true,
              allowInvalidContainer: true,
              defaultEdgeType: 'straight',
              enableEdgeEvents: true,
              edgeProgramClasses: {
                straight: EdgeArrowProgram,
                curved: EdgeCurvedArrowProgram,
              },
            }}
            graph={MultiDirectedGraph}
          >
            <SigmaControls
              graph={graph}
              setShowCursor={setShowCursor}
              defaultLayout="forceatlas2"
              initialZoom={initialZoom}
            />
          </SigmaContainer>
        )
      )}
    </div>
  )
}

const SigmaControls = ({
  graph,
  setShowCursor,
  defaultLayout,
  initialZoom,
}: {
  graph: MultiDirectedGraph<NetworkGraphNode, NetworkGraphEdge>
  setShowCursor: (hovering: boolean) => void
  defaultLayout: 'circular' | 'forceatlas2'
  initialZoom?: number
}) => {
  const sigma = useSigma()
  const registerEvents = useRegisterEvents()
  const loadGraph = useLoadGraph()
  const setSettings = useSetSettings()
  const { reset: recenter } = useCamera()

  useEffect(() => {
    if (initialZoom) {
      const camera = sigma.getCamera()
      camera.ratio = initialZoom
      sigma.refresh()
    }
  }, [sigma, initialZoom])

  const { positions: circularPositions } = useLayoutCircular({ scale: 100 })

  const customPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  )
  const { start: startForceAtlas2, stop: stopForceAtlas2 } =
    useWorkerLayoutForceAtlas2({
      settings: {
        ...forceAtlas2.inferSettings(graph),
        ...forceAtlas2SettingsOverrides,
      },
      outputReducer: (node, attributes) => {
        if (customPositionsRef.current.has(node)) {
          return {
            ...attributes,
            x: customPositionsRef.current.get(node)?.x,
            y: customPositionsRef.current.get(node)?.y,
          }
        }

        return attributes
      },
    })

  const [layout, setLayout] = useState<typeof defaultLayout>(defaultLayout)

  const stopAnimationRef = useRef<() => void>(() => {})

  const setCircularLayout = useCallback(() => {
    stopAnimationRef.current()
    setLayout('circular')
    recenter()

    const positions = circularPositions()
    // Override with custom positions
    // customPositionsRef.current.forEach((pos, node) => {
    //   if (positions[node]) {
    //     positions[node] = pos
    //   }
    // })

    stopAnimationRef.current = animateNodes(
      sigma.getGraph(),
      positions,
      {
        duration: forceAtlas2Duration,
        easing: 'linear',
      },
      () => recenter()
    )
  }, [sigma, circularPositions, recenter])

  const setForceAtlas2Layout = useCallback(() => {
    stopAnimationRef.current()
    setLayout('forceatlas2')
    recenter()
    startForceAtlas2()

    // const stop = () => {
    //   stopForceAtlas2()

    //   recenter()
    //   clearTimeout(timeout)
    //   stopAnimationRef.current = () => {}
    // }
    // const timeout = setTimeout(stop, forceAtlas2Duration)
    // stopAnimationRef.current = stop
  }, [startForceAtlas2, stopForceAtlas2, recenter, sigma])

  const tooltipRefs = useRef<{
    nodes: Record<string, HTMLDivElement>
    edges: Record<string, HTMLDivElement>
  }>({
    nodes: {},
    edges: {},
  })
  const nodeTooltipPaddingX = 10
  const nodeTooltipPaddingY = 16

  const getNodeTooltipPosition = useCallback(
    (node: string, attributes?: NetworkGraphNode) => {
      const { x, y, size } =
        attributes ?? sigma.getGraph().getNodeAttributes(node)
      const { x: viewportX, y: viewportY } = sigma.graphToViewport({ x, y })
      const { width: viewWidth } = sigma.getDimensions()
      const isOnRight = viewportX > viewWidth / 2
      return {
        // Use left for positioning if on the left side of the screen, and right if on the right side, so that the tooltip overflows the screen on the side it's on with its node. Just using the left position causes the tooltip to scrunch up against the right side of the screen in an unintuitive way.
        ...(isOnRight
          ? {
              left: 'unset',
              // Set the right position where the left edge should be, and then translate it to the right by the width of the tooltip (since it's dynamically sized, we can't subtract it from the right position).
              right: viewWidth - (viewportX + size / 2 + nodeTooltipPaddingX),
              transform: 'translateX(100%)',
            }
          : {
              left: viewportX + size / 2 + nodeTooltipPaddingX,
              right: 'unset',
              transform: 'translateX(0)',
            }),
        top: viewportY + size / 2 + nodeTooltipPaddingY,
      }
    },
    [sigma]
  )
  const getEdgeTooltipPosition = useCallback(
    (
      edge: string,
      sourceAttributes?: NetworkGraphNode,
      targetAttributes?: NetworkGraphNode
    ) => {
      const { x: sourceX, y: sourceY } =
        sourceAttributes ?? sigma.getGraph().getSourceAttributes(edge)
      const { x: targetX, y: targetY } =
        targetAttributes ?? sigma.getGraph().getTargetAttributes(edge)
      const x = (sourceX + targetX) / 2
      const y = (sourceY + targetY) / 2
      const { x: viewportX, y: viewportY } = sigma.graphToViewport({ x, y })
      // Get dimensions dynamically to handle fullscreen mode
      const { width: viewWidth } = sigma.getDimensions()
      const isOnRight = viewportX > viewWidth / 2
      return {
        // Use left for positioning if on the left side of the screen, and right if on the right side, so that the tooltip overflows the screen on the side it's on with its node. Just using the left position causes the tooltip to scrunch up against the right side of the screen in an unintuitive way.
        ...(isOnRight
          ? {
              left: 'unset',
              // Set the right position where the left edge should be, and then translate it to the right by the width of the tooltip (since it's dynamically sized, we can't subtract it from the right position).
              right: viewWidth - viewportX,
            }
          : {
              left: viewportX,
              right: 'unset',
            }),
        top: viewportY,
        transform: 'translateX(-50%) translateY(-50%)',
      }
    },
    [sigma]
  )

  const updateTooltipPositions = useCallback(() => {
    Object.entries(tooltipRefs.current.nodes).forEach(([node, el]) => {
      Object.entries(getNodeTooltipPosition(node)).forEach(([key, value]) => {
        el.style[key as 'left' | 'top' | 'right' | 'transform'] =
          typeof value === 'number' ? value + 'px' : value
      })
    })
    Object.entries(tooltipRefs.current.edges).forEach(([edge, el]) => {
      Object.entries(getEdgeTooltipPosition(edge)).forEach(([key, value]) => {
        el.style[key as 'left' | 'top' | 'right' | 'transform'] =
          typeof value === 'number' ? value + 'px' : value
      })
    })
  }, [getNodeTooltipPosition, getEdgeTooltipPosition])

  // Update tooltip positions when container dimensions change (resize, fullscreen)
  useEffect(() => {
    const handleResize = () => {
      // Use requestAnimationFrame to ensure Sigma.js has updated its dimensions
      requestAnimationFrame(() => {
        updateTooltipPositions()
      })
    }

    // Listen for resize events
    window.addEventListener('resize', handleResize)
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleResize)
    document.addEventListener('webkitfullscreenchange', handleResize)
    document.addEventListener('mozfullscreenchange', handleResize)
    document.addEventListener('MSFullscreenChange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('fullscreenchange', handleResize)
      document.removeEventListener('webkitfullscreenchange', handleResize)
      document.removeEventListener('mozfullscreenchange', handleResize)
      document.removeEventListener('MSFullscreenChange', handleResize)
    }
  }, [updateTooltipPositions])

  const startForceAtlas2Ref = useUpdatingRef(startForceAtlas2)
  const [hoverState, setHoverState] = useState<NetworkGraphHoverState>(null)
  useEffect(() => {
    loadGraph(graph)

    const manager = new NetworkGraphManager({
      sigma,
      graph,
      hoverDelay: 50,
      unhoverDelay: 75,
      undragDelay: 50,
      onStateChange: (state, shouldShowCursor) => {
        setHoverState(state)
        setShowCursor(shouldShowCursor)
      },
      onLayoutUpdate: updateTooltipPositions,
    })

    // Restore custom positions if they exist
    if (customPositionsRef.current.size > 0) {
      manager.applyCustomPositions(customPositionsRef.current)
      console.log('applied custom positions', customPositionsRef.current)
    }

    customPositionsRef.current = manager.getCustomPositions()

    // Register event handlers
    manager.register(registerEvents)

    // Start force atlas 2 layout.
    setTimeout(() => {
      startForceAtlas2Ref.current()
    }, 250)

    return () => manager.cleanup()
  }, [
    sigma,
    graph,
    loadGraph,
    registerEvents,
    setHoverState,
    setShowCursor,
    updateTooltipPositions,
  ])

  useEffect(() => {
    setSettings({
      nodeReducer: (node, data) => {
        const newData: Partial<NodeDisplayData> = {
          ...data,
          highlighted: data.highlighted || false,
        }

        if (hoverState) {
          if (hoverState.nodes.includes(node)) {
            newData.highlighted = true
          } else {
            newData.color = '#E2E2E2'
            newData.highlighted = false
            newData.label = ''
            // newData.hidden = true
          }
        }

        return newData
      },
      edgeReducer: (edge, data) => ({
        ...data,
        hidden: !!hoverState && !hoverState.edges.includes(edge),
      }),
    })
  }, [setSettings, sigma, hoverState, graph])

  return (
    <>
      <ControlsContainer position="top-left">
        <ZoomControl />
        <FullScreenControl />

        {layout === 'circular' ? (
          <div className="react-sigma-control">
            <button title="Spread Out" onClick={setForceAtlas2Layout}>
              <Waypoints width="1em" height="1em" />
            </button>
          </div>
        ) : (
          <div className="react-sigma-control">
            <button title="Round Out" onClick={setCircularLayout}>
              <CircleDashed width="1em" height="1em" />
            </button>
          </div>
        )}
      </ControlsContainer>

      {Array.from(graph.nodeEntries()).map(({ node, attributes }) => {
        const visible =
          !!hoverState &&
          // Only show node tooltips if hovering an edge (when hovering over a
          // node, there are too many, and it gets very cluttered).
          hoverState.type === 'edge' &&
          hoverState.nodes.includes(node)
        const style = getNodeTooltipPosition(node, attributes)

        return (
          <div
            ref={(el) => {
              if (el) {
                tooltipRefs.current.nodes[node] = el
              } else {
                delete tooltipRefs.current.nodes[node]
              }
            }}
            key={node}
            className={cn(
              'absolute flex flex-col items-center justify-center rounded-sm px-2 py-1 bg-primary/10 text-primary backdrop-blur-xs pointer-events-none transition-opacity duration-150',
              visible ? 'opacity-100' : 'opacity-0'
            )}
            style={style}
          >
            <p className="text-xs">
              Score: {formatBigNumber(attributes.value, undefined, true)}
            </p>
          </div>
        )
      })}

      {Array.from(graph.edgeEntries()).map(
        ({ edge, attributes, sourceAttributes, targetAttributes }) => {
          const visible = !!hoverState && hoverState.edges.includes(edge)
          const style = getEdgeTooltipPosition(
            edge,
            sourceAttributes,
            targetAttributes
          )

          return (
            <div
              ref={(el) => {
                if (el) {
                  tooltipRefs.current.edges[edge] = el
                } else {
                  delete tooltipRefs.current.edges[edge]
                }
              }}
              key={edge}
              className={cn(
                'absolute flex flex-col items-center justify-center rounded-sm px-2 py-1 bg-primary/10 text-primary backdrop-blur-xs pointer-events-none transition-opacity duration-150',
                visible ? 'opacity-100' : 'opacity-0'
              )}
              style={style}
            >
              <p className="text-xs">{attributes.label}%</p>
            </div>
          )
        }
      )}
    </>
  )
}
