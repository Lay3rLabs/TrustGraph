import { MultiDirectedGraph } from 'graphology'

export type HoverTargetType = 'node' | 'edge'

export type HoverState = {
  type: HoverTargetType
  target: string
  nodes: string[]
  edges: string[]
} | null

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
  private state: InternalState = 'IDLE'
  private hoverState: HoverState | null = null
  private timeout: NodeJS.Timeout | null = null
  private config: HoverConfig
  private onStateChange: (state: HoverState, showCursor: boolean) => void
  private graph: MultiDirectedGraph

  constructor(
    graph: MultiDirectedGraph,
    config: HoverConfig,
    onStateChange: (state: HoverState, showCursor: boolean) => void
  ) {
    this.graph = graph
    this.config = config
    this.onStateChange = onStateChange
  }

  // Public API - called by event handlers

  hover(type: HoverTargetType, target: string): void {
    this.setHover(type, target)
  }

  unhover(type: HoverTargetType, target: string): void {
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

  private notifyChange(state: HoverState): void {
    this.hoverState = state
    const showCursor = this.state !== 'IDLE'
    this.onStateChange(state, showCursor)
  }
}
