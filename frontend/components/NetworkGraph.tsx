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
import { useQuery } from '@tanstack/react-query'
import { MultiDirectedGraph } from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { CircleDashed, LoaderCircle, Waypoints } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EdgeArrowProgram } from 'sigma/rendering'
import { NodeDisplayData } from 'sigma/types'
import { animateNodes } from 'sigma/utils'

import { useBatchEnsQuery } from '@/hooks/useEns'
import { HoverState, HoverStateMachine } from '@/lib/HoverStateMachine'
import { Network, isTrustedSeed } from '@/lib/network'
import { cn, formatBigNumber } from '@/lib/utils'
import { ponderQueries } from '@/queries/ponder'

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

  // Red -> Yellow -> Green
  // if (clampedValue <= 50) {
  //   // Interpolate from red to yellow (0-50)
  //   const ratio = clampedValue / 50
  //   const red = 255
  //   const green = Math.round(255 * ratio)
  //   const blue = 0
  //   return `rgb(${red}, ${green}, ${blue})`
  // } else {
  //   // Interpolate from yellow to green (50-100)
  //   const ratio = (clampedValue - 50) / 50
  //   const red = Math.round(255 * (1 - ratio))
  //   const green = 255
  //   const blue = 0
  //   return `rgb(${red}, ${green}, ${blue})`
  // }

  // Red -> Blue
  // const ratio = clampedValue / 100
  // const red = Math.round(255 * (1 - ratio))
  // const green = 0
  // const blue = Math.round(255 * ratio)
  // return `rgb(${red}, ${green}, ${blue})`

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

  return '#888'
}

export interface NetworkGraphNode {
  label: string
  x: number
  y: number
  size: number
  value: bigint
  sent: number
  received: number
  color?: string
}

export interface NetworkGraphProps {
  network: Network
  className?: string
}

export function NetworkGraph({ network, className }: NetworkGraphProps) {
  const { isLoading, error, data } = useQuery({
    ...ponderQueries.attestationsGraph,
    refetchInterval: 10_000,
  })

  // Load ENS data
  const { data: ensData } = useBatchEnsQuery(
    data?.accounts.map((account) => account.account) || []
  )

  const [showCursor, setShowCursor] = useState(false)

  const graph = useMemo(() => {
    if (!data) {
      return null
    }

    // Create the graph
    const graph = new MultiDirectedGraph<NetworkGraphNode>()

    const maxValue = Number(
      data.accounts.reduce(
        (max, { value }) => (BigInt(value) > max ? BigInt(value) : max),
        0n
      )
    )
    const minValue = Number(
      data.accounts.reduce(
        (min, { value }) => (BigInt(value) < min ? BigInt(value) : min),
        BigInt(maxValue)
      )
    )

    const minNodeSize = 8
    const maxNodeSize = 16

    const minConfidence = 0
    const maxConfidence = 100
    const minEdgeSize = 2
    const maxEdgeSize = 8

    for (const { account, value, sent, received } of data.accounts) {
      // Normalize value to 0-100 scale
      const normalizedValue =
        maxValue === minValue
          ? 50 // Default to middle if all values are the same
          : ((Number(value) - minValue) / (maxValue - minValue)) * 100

      graph.addNode(account, {
        label:
          (ensData?.[account]?.name ||
            `${account.slice(0, 6)}...${account.slice(-4)}`) +
          (isTrustedSeed(network, account) ? ' 🌱' : ''),
        x: 0,
        y: 0,
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
      })
    }

    for (const attestation of data.attestations) {
      const confidence = Number(attestation.decodedData?.confidence || 50)
      const size =
        minEdgeSize +
        ((confidence - minConfidence) / (maxConfidence - minConfidence)) *
          (maxEdgeSize - minEdgeSize)
      graph.addEdgeWithKey(
        attestation.uid,
        attestation.attester,
        attestation.recipient,
        {
          label: attestation.decodedData?.confidence?.toString() || 'unknown',
          size,
        }
      )
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

    return graph
  }, [data, ensData])

  if (isLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center border border-border rounded-md p-4">
        <LoaderCircle size={24} className="animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="w-full h-full flex justify-center items-center border border-destructive rounded-md p-4">
        <p className="text-sm text-destructive">
          Error: {error?.message || 'No data'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {graph && (
        <SigmaContainer
          className={cn(
            '!bg-transparent border border-border rounded-md',
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
          <SigmaControls graph={graph} setShowCursor={setShowCursor} />
        </SigmaContainer>
      )}
    </div>
  )
}

const SigmaControls = ({
  graph,
  setShowCursor,
}: {
  graph: MultiDirectedGraph<NetworkGraphNode>
  setShowCursor: (hovering: boolean) => void
}) => {
  const sigma = useSigma()
  const registerEvents = useRegisterEvents()
  const loadGraph = useLoadGraph()
  const setSettings = useSetSettings()
  const { reset: recenter } = useCamera()

  const { positions: circularPositions } = useLayoutCircular({ scale: 100 })
  const { start: startForceAtlas2, stop: stopForceAtlas2 } =
    useWorkerLayoutForceAtlas2({
      settings: {
        ...forceAtlas2.inferSettings(graph),

        // Bind nodes more tightly together.
        gravity: 1,

        // Push hubs outwards to highlight them (disrupts spatial balance)
        // outboundAttractionDistribution: true,
      },
    })

  const [layout, setLayout] = useState<'circular' | 'forceatlas2'>('circular')
  const [hoverState, setHoverState] = useState<HoverState>(null)
  const hoverMachine = useRef<HoverStateMachine | null>(null)

  const stopAnimationRef = useRef<() => void>(() => {})

  const setCircularLayout = useCallback(() => {
    stopAnimationRef.current()
    setLayout('circular')
    recenter()
    stopAnimationRef.current = animateNodes(
      sigma.getGraph(),
      circularPositions(),
      {
        duration: 500,
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

    const stop = () => {
      stopForceAtlas2()
      recenter()
      clearTimeout(timeout)
      stopAnimationRef.current = () => {}
    }
    const timeout = setTimeout(stop, 500)
    stopAnimationRef.current = stop
  }, [startForceAtlas2, stopForceAtlas2, recenter])

  useEffect(() => {
    loadGraph(graph)
    if (layout === 'circular') {
      setCircularLayout()
    } else {
      setForceAtlas2Layout()
    }
  }, [graph, loadGraph, layout, setCircularLayout, setForceAtlas2Layout])

  const tooltipRefs = useRef<Record<string, HTMLDivElement>>({})
  const tooltipPaddingX = 10
  const tooltipPaddingY = 16

  const { width: viewWidth } = sigma.getDimensions()
  const getNodeTooltipPosition = useCallback(
    (node: string, attributes?: NetworkGraphNode) => {
      const { x, y, size } =
        attributes ?? sigma.getGraph().getNodeAttributes(node)
      const { x: viewportX, y: viewportY } = sigma.graphToViewport({ x, y })
      const isOnRight = viewportX > viewWidth / 2
      return {
        // Use left for positioning if on the left side of the screen, and right if on the right side, so that the tooltip overflows the screen on the side it's on with its node. Just using the left position causes the tooltip to scrunch up against the right side of the screen in an unintuitive way.
        ...(isOnRight
          ? {
              left: 'unset',
              // Set the right position where the left edge should be, and then translate it to the right by the width of the tooltip (since it's dynamically sized, we can't subtract it from the right position).
              right: viewWidth - (viewportX + size / 2 + tooltipPaddingX),
              transform: 'translateX(100%)',
            }
          : {
              left: viewportX + size / 2 + tooltipPaddingX,
              right: 'unset',
              transform: 'translateX(0)',
            }),
        top: viewportY + size / 2 + tooltipPaddingY,
      }
    },
    [sigma]
  )

  // Initialize hover state machine
  useEffect(() => {
    hoverMachine.current = new HoverStateMachine(
      graph,
      {
        hoverDelay: 50,
        unhoverDelay: 75,
      },
      (state, shouldShowCursor) => {
        setHoverState(state)
        setShowCursor(shouldShowCursor)
      }
    )

    return () => hoverMachine.current?.cleanup()
  }, [graph, setShowCursor])

  // Register event handlers
  useEffect(() => {
    const updateTooltipPositions = () => {
      Object.entries(tooltipRefs.current).forEach(([node, el]) => {
        Object.entries(getNodeTooltipPosition(node)).forEach(([key, value]) => {
          el.style[key as 'left' | 'top' | 'right' | 'transform'] =
            typeof value === 'number' ? value + 'px' : value
        })
      })
    }

    let isHoldingDown = false
    let didMove = false
    const isDragging = () => isHoldingDown && didMove

    const contactStart = () => {
      isHoldingDown = true
      didMove = false
    }
    const contactEnd = () => {
      isHoldingDown = false
      didMove = false
    }
    const contactMove = () => {
      if (!isHoldingDown) {
        return
      }
      didMove = true
      updateTooltipPositions()
    }

    registerEvents({
      enterNode: ({ node }) => {
        if (!isDragging()) {
          hoverMachine.current?.hover('node', node)
        }
      },
      enterEdge: ({ edge }) => {
        if (!isDragging()) {
          console.log('enter edge', edge)
          hoverMachine.current?.hover('edge', edge)
        }
      },
      leaveNode: ({ node }) => {
        if (!isDragging()) {
          hoverMachine.current?.unhover('node', node)
        }
      },
      leaveEdge: ({ edge }) => {
        if (!isDragging()) {
          console.log('leave edge', edge)
          hoverMachine.current?.unhover('edge', edge)
        }
      },
      clickNode: ({ node }) => {
        hoverMachine.current?.clickNode(node)
      },
      clickEdge: ({ edge }) => {
        hoverMachine.current?.clickEdge(edge)
      },

      mousedown: contactStart,
      touchdown: contactStart,

      mousemovebody: contactMove,
      touchmovebody: contactMove,

      mouseup: contactEnd,
      touchup: contactEnd,
    })
  }, [registerEvents, getNodeTooltipPosition])

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
        const visible = !!hoverState && hoverState.nodes.includes(node)
        const style = getNodeTooltipPosition(node, attributes)

        return (
          <div
            ref={(el) => {
              if (el) {
                tooltipRefs.current[node] = el
              } else {
                delete tooltipRefs.current[node]
              }
            }}
            key={node}
            className={cn(
              'absolute flex flex-col items-center justify-center rounded-sm px-3 py-2 bg-primary/10 text-primary backdrop-blur-xs pointer-events-none transition-opacity duration-150',
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
    </>
  )
}
