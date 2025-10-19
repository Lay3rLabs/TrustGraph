import { EventHandlers } from '@react-sigma/core'
import { MultiDirectedGraph } from 'graphology'

export type HoverTargetType = 'node' | 'edge'

export type HoverState = {
  type: HoverTargetType
  target: string
  nodes: string[]
  edges: string[]
} | null

export type DragState = 'IDLE' | 'DRAG_START' | 'DRAGGING'

export type HoverConfig = {
  hoverDelay: number
  unhoverDelay: number
}

type InternalState =
  | 'IDLE'
  | 'PREPARING_HOVER'
  | 'HOVERING'
  | 'PREPARING_UNHOVER'

export class HoverStateMachine {
  private graph: MultiDirectedGraph
  private config: HoverConfig
  private onStateChange: (state: HoverState, showCursor: boolean) => void
  private onDrag: () => void

  private state: InternalState = 'IDLE'
  private hoverState: HoverState | null = null
  private timeout: NodeJS.Timeout | null = null

  private dragState: DragState = 'IDLE'

  constructor({
    graph,
    onStateChange,
    onDrag,
    ...config
  }: {
    graph: MultiDirectedGraph
    onStateChange: (state: HoverState, showCursor: boolean) => void
    onDrag: () => void
  } & HoverConfig) {
    this.graph = graph
    this.config = config
    this.onStateChange = onStateChange
    this.onDrag = onDrag
  }

  // Public API - called by event handlers

  register(
    registerEvents: (eventHandlers: Partial<EventHandlers>) => void
  ): void {
    registerEvents({
      enterNode: ({ node }) => this.hover('node', node),
      enterEdge: ({ edge }) => this.hover('edge', edge),
      leaveNode: ({ node }) => this.unhover('node', node),
      leaveEdge: ({ edge }) => this.unhover('edge', edge),
      clickNode: ({ node }) => this.clickNode(node),
      clickEdge: ({ edge }) => this.clickEdge(edge),
      mousedown: () => this.dragStart(),
      touchdown: () => this.dragStart(),
      mouseup: () => this.dragEnd(),
      touchup: () => this.dragEnd(),
      mousemovebody: () => this.maybeDragMove(),
      touchmovebody: () => this.maybeDragMove(),
    })
  }

  hover(type: HoverTargetType, target: string): void {
    // Don't change hover state if we're dragging
    if (this.isDragging()) {
      return
    }

    this.setHover(type, target)
  }

  unhover(type: HoverTargetType, target: string): void {
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
      this.clearPendingTransition()

      // Schedule transition to IDLE with unhover delay
      this.state = 'PREPARING_UNHOVER'
      this.timeout = setTimeout(() => {
        this.state = 'IDLE'
        this.notifyChange(null)
      }, this.config.unhoverDelay)
    }
  }

  clickNode(node: string): void {
    // Check if clicked node is already visible in the hover state
    if (this.hoverState?.nodes.includes(node)) {
      // Already hovering the node, open in new tab
      window.open(`/account/${node}`, '_blank')
    } else {
      // Not hovering yet, begin hovering immediately
      this.setHover('node', node, true)
    }
  }

  clickEdge(edge: string): void {
    // Check if clicked edge is already visible in the hover state
    if (this.hoverState?.edges.includes(edge)) {
      // Already hovering the edge, open in new tab
      window.open(`/attestations/${edge}`, '_blank')
    } else {
      // Not hovering yet, begin hovering immediately
      this.setHover('edge', edge, true)
    }
  }

  dragStart(): void {
    this.dragState = 'DRAG_START'
  }

  dragEnd(): void {
    this.dragState = 'IDLE'
  }

  maybeDragMove(): void {
    if (this.dragState !== 'DRAG_START') {
      return
    }
    this.dragState = 'DRAGGING'
    this.onDrag()
  }

  cleanup(): void {
    this.clearPendingTransition()
  }

  // Internal methods

  private setHover(
    type: HoverTargetType,
    target: string,
    forceImmediate?: boolean
  ): void {
    this.clearPendingTransition()

    const newState: HoverState = {
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
      this.timeout = setTimeout(() => {
        this.state = 'HOVERING'
        this.notifyChange(newState)
      }, this.config.hoverDelay)
    }
  }

  private clearPendingTransition(): void {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  private isCurrentTarget(type: HoverTargetType, target: string): boolean {
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

  private notifyChange(state: HoverState): void {
    this.hoverState = state
    const showCursor = this.state !== 'IDLE'
    this.onStateChange(state, showCursor)
  }
}
