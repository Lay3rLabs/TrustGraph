import { EventHandlers } from '@react-sigma/core'
import { MultiDirectedGraph } from 'graphology'
import { Sigma } from 'sigma'
import { MouseCoords, TouchCoords } from 'sigma/types'

import { NetworkGraphEdge, NetworkGraphNode } from '@/lib/network'

export type NetworkGraphTargetType = 'node' | 'edge'

export type NetworkGraphHoverState = {
  type: NetworkGraphTargetType
  touch?: 'first' | 'second'
  target: string
  nodes: string[]
  edges: string[]
} | null

export type NetworkGraphDragState =
  | 'IDLE'
  | 'DRAG_START'
  | 'DRAGGING'
  | 'PREPARING_UNDRAG'

export type NetworkGraphHoverConfig = {
  alwaysHoverNode?: string
  hoverDelay: number
  unhoverDelay: number
  undragDelay: number
}

export type NetworkGraphInternalState =
  | 'IDLE'
  | 'PREPARING_HOVER'
  | 'HOVERING'
  | 'PREPARING_UNHOVER'

export class NetworkGraphManager {
  private sigma: Sigma
  private graph: MultiDirectedGraph<NetworkGraphNode, NetworkGraphEdge>
  private config: NetworkGraphHoverConfig
  private onStateChange: (
    state: NetworkGraphHoverState,
    showCursor: boolean
  ) => void
  private onLayoutUpdate: () => void

  private state: NetworkGraphInternalState = 'IDLE'
  private hoverState: NetworkGraphHoverState | null = null
  private hoverTimeout: NodeJS.Timeout | null = null

  private dragState: NetworkGraphDragState = 'IDLE'
  private dragTimeout: NodeJS.Timeout | null = null
  private draggedNode: string | null = null
  private dragOffset: { x: number; y: number } | null = null
  private customPositions: Map<string, { x: number; y: number }> = new Map()

  constructor({
    sigma,
    graph,
    onStateChange,
    onLayoutUpdate,
    ...config
  }: {
    sigma: Sigma
    graph: MultiDirectedGraph<NetworkGraphNode, NetworkGraphEdge>
    onStateChange: (state: NetworkGraphHoverState, showCursor: boolean) => void
    onLayoutUpdate: () => void
  } & NetworkGraphHoverConfig) {
    this.sigma = sigma
    this.graph = graph
    this.config = config
    this.onStateChange = onStateChange
    this.onLayoutUpdate = onLayoutUpdate
  }

  // Public API - called by event handlers

  register(
    registerEvents: (eventHandlers: Partial<EventHandlers>) => void
  ): void {
    registerEvents({
      ...(!this.config.alwaysHoverNode
        ? {
            enterNode: ({ node }) => this.hover('node', node),
            enterEdge: ({ edge }) => this.hover('edge', edge),
            leaveNode: ({ node }) => this.unhover('node', node),
            leaveEdge: ({ edge }) => this.unhover('edge', edge),
          }
        : {}),

      clickNode: ({ node }) => this.click('node', node),
      clickEdge: ({ edge }) => this.click('edge', edge),
      downNode: (event) => this.downNode(event.node, event.event),
      mousedown: () => this.contactStart(),
      touchdown: () => this.contactStart(),
      mouseup: () => this.contactEnd(),
      touchup: () => {
        // Mark first touch interaction if not already marked for the current hover state (this is called right before clickNode/clickEdge).
        if (this.hoverState && !this.hoverState.touch) {
          this.hoverState.touch = 'first'
        }

        this.contactEnd()
      },
      mousemovebody: (event) => this.maybeDragMove(event, event),
      touchmovebody: (event) => this.maybeDragMove(event, event.touches[0]),
      afterRender: () => this.onLayoutUpdate(),
    })

    if (this.config.alwaysHoverNode) {
      this.setHover('node', this.config.alwaysHoverNode, true)
    }
  }

  hover(type: NetworkGraphTargetType, target: string): void {
    // Don't change hover state if we're dragging
    if (this.isDragging()) {
      return
    }

    this.setHover(type, target)
  }

  unhover(type: NetworkGraphTargetType, target: string): void {
    // Don't unhover if we're dragging
    if (this.isDragging()) {
      return
    }

    // Only unhover if we're hovering the target or about to be hovering.
    if (
      this.isHoveringOrPreparingTo() &&
      // hoverState is null during PREPARING_HOVER, but we should still allow unhovering
      (!this.hoverState || this.isCurrentTarget(type, target))
    ) {
      this.setUnhover()
    }
  }

  click(type: NetworkGraphTargetType, target: string): void {
    // Don't click if we're dragging or were just dragging (click fires right
    // after contactEnd which schedules a drag transition to IDLE).
    if (this.isOrWasJustDragging()) {
      return
    }

    // Check if clicked target is already visible in the hover state
    if (
      this.hoverState &&
      (type === 'node'
        ? this.hoverState?.nodes.includes(target)
        : this.hoverState?.edges.includes(target))
    ) {
      // On touch, require second tap before opening link
      if (this.hoverState.touch === 'first') {
        this.hoverState.touch = 'second'
        return
      }

      const href =
        type === 'node'
          ? this.graph.getNodeAttribute(target, 'href')
          : this.graph.getEdgeAttribute(target, 'href')

      if (href) {
        // Open in new tab
        window.open(href, '_blank')
      }
    } else {
      // Not hovering yet, begin hovering immediately
      this.setHover(type, target, true)
    }
  }

  downNode(node: string, event: { x: number; y: number }): void {
    this.draggedNode = node

    // Calculate drag offset: difference between mouse position and node position
    const nodeAttributes = this.graph.getNodeAttributes(node)
    const { x: mouseX, y: mouseY } = this.sigma.viewportToGraph(event)

    this.dragOffset = {
      x: nodeAttributes.x - mouseX,
      y: nodeAttributes.y - mouseY,
    }

    // Disable camera drag
    this.sigma.getCamera().disable()
  }

  contactStart(): void {
    this.clearPendingDragTransition()
    this.dragState = 'DRAG_START'
  }

  contactEnd(): void {
    this.clearPendingDragTransition()

    // If was dragging a node, re-hover.
    // if (this.draggedNode && this.isDragging()) {
    //   this.setHover('node', this.draggedNode, true)
    // }

    // Re-enable camera drag
    this.sigma.getCamera().enable()

    this.draggedNode = null
    this.dragOffset = null
    if (this.isDragging()) {
      // Schedule clearing drag state with delay if just stopped dragging.
      this.dragState = 'PREPARING_UNDRAG'
      this.dragTimeout = setTimeout(() => {
        this.dragState = 'IDLE'
      }, this.config.undragDelay)
    } else {
      // If not dragging, clear drag state immediately.
      this.dragState = 'IDLE'
    }
  }

  maybeDragMove(
    event: MouseCoords | TouchCoords,
    { x, y }: { x: number; y: number }
  ): void {
    if (this.dragState === 'IDLE' || this.dragState === 'PREPARING_UNDRAG') {
      return
    }

    this.dragState = 'DRAGGING'

    // If we're dragging a node, prevent default sigma behavior (camera drag)
    // and unhover if hovering.
    if (this.draggedNode) {
      event.preventSigmaDefault()
      event.original.preventDefault()
      event.original.stopPropagation()

      if (this.isHoveringOrPreparingTo()) {
        this.setUnhover(true)
      }
    }

    // If we're dragging a node, update its position
    if (this.draggedNode && this.dragOffset) {
      const { x: mouseX, y: mouseY } = this.sigma.viewportToGraph({ x, y })

      const newX = mouseX + this.dragOffset.x
      const newY = mouseY + this.dragOffset.y

      this.graph.setNodeAttribute(this.draggedNode, 'x', newX)
      this.graph.setNodeAttribute(this.draggedNode, 'y', newY)

      // Store the custom position
      this.customPositions.set(this.draggedNode, { x: newX, y: newY })

      this.sigma.refresh()
    }

    this.onLayoutUpdate()
  }

  cleanup(): void {
    this.clearPendingHoverTransition()
  }

  getCustomPositions(): Map<string, { x: number; y: number }> {
    return this.customPositions
  }

  applyCustomPositions(positions: Map<string, { x: number; y: number }>): void {
    this.customPositions = positions
    positions.forEach((pos, node) => {
      if (this.graph.hasNode(node)) {
        this.graph.setNodeAttribute(node, 'x', pos.x)
        this.graph.setNodeAttribute(node, 'y', pos.y)
      }
    })
    this.sigma.refresh()
  }

  // Internal methods

  private setHover(
    type: NetworkGraphTargetType,
    target: string,
    forceImmediate?: boolean
  ): void {
    this.clearPendingHoverTransition()

    const newState: NetworkGraphHoverState = {
      type,
      target,
      nodes:
        type === 'node'
          ? [...new Set([target, ...this.graph.neighbors(target)])]
          : this.graph.extremities(target),
      edges: type === 'node' ? this.graph.edges(target) : [target],
    }

    // Hover immediately if we're already hovering or if forceImmediate is true.
    if (forceImmediate ?? this.isHovering()) {
      this.state = 'HOVERING'
      this.notifyChange(newState)
    } else {
      // Prepare to hover
      this.state = 'PREPARING_HOVER'
      this.notifyChange(null)

      // Schedule hover
      this.hoverTimeout = setTimeout(() => {
        this.state = 'HOVERING'
        this.notifyChange(newState)
      }, this.config.hoverDelay)
    }
  }

  private setUnhover(immediate?: boolean): void {
    this.clearPendingHoverTransition()

    if (immediate) {
      this.state = 'IDLE'
      this.notifyChange(null)
    } else {
      // Schedule transition to IDLE with unhover delay
      this.state = 'PREPARING_UNHOVER'
      this.hoverTimeout = setTimeout(() => {
        this.state = 'IDLE'
        this.notifyChange(null)
      }, this.config.unhoverDelay)
    }
  }

  private clearDragState(): void {
    this.dragState = 'IDLE'
    this.draggedNode = null
    this.dragOffset = null
  }

  private clearPendingHoverTransition(): void {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout)
      this.hoverTimeout = null
    }
  }

  private clearPendingDragTransition(): void {
    if (this.dragTimeout) {
      clearTimeout(this.dragTimeout)
      this.dragTimeout = null
    }
  }

  private isCurrentTarget(
    type: NetworkGraphTargetType,
    target: string
  ): boolean {
    return (
      !!this.hoverState &&
      this.hoverState.type === type &&
      this.hoverState.target === target
    )
  }

  private isHovering(): boolean {
    return this.state === 'HOVERING' || this.state === 'PREPARING_UNHOVER'
  }

  private isHoveringOrPreparingTo(): boolean {
    return this.isHovering() || this.state === 'PREPARING_HOVER'
  }

  private isDragging(): boolean {
    return this.dragState === 'DRAGGING'
  }

  private isOrWasJustDragging(): boolean {
    return (
      this.dragState === 'DRAGGING' || this.dragState === 'PREPARING_UNDRAG'
    )
  }

  private notifyChange(state: NetworkGraphHoverState): void {
    this.hoverState = state
    const showCursor = this.state !== 'IDLE'
    this.onStateChange(state, showCursor)
  }
}
