/* tslint:disable */
/* eslint-disable */
/**
 * Configuration for the Trust Aware PageRank algorithm
 */
export class PageRankConfig {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Create a new PageRankConfig for WASM
   */
  constructor(damping_factor: number, max_iterations: number, tolerance: number, min_weight: number, max_weight: number, trust_config: TrustConfig);
  /**
   * Set trust configuration (WASM-compatible)
   */
  setTrustConfig(trust_config: TrustConfig): void;
  /**
   * Get trust configuration (WASM-compatible)
   */
  getTrustConfig(): TrustConfig;
  /**
   * Damping factor (usually 0.85)
   */
  dampingFactor: number;
  /**
   * Maximum number of iterations
   */
  maxIterations: number;
  /**
   * Convergence threshold
   */
  tolerance: number;
  /**
   * Minimum weight value
   */
  minWeight: number;
  /**
   * Maximum weight value
   */
  maxWeight: number;
}
/**
 * A directed graph for Trust Aware PageRank computation
 */
export class PageRankGraphComputer {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Create a new PageRankGraphComputer for WASM
   */
  constructor(allow_duplicates: boolean);
  /**
   * Add an edge from attester to recipient with base weight
   */
  addEdge(from: string, to: string, base_weight: number): void;
  /**
   * Get all nodes in the graph
   */
  nodes(): string[];
  /**
   * Calculate Trust Aware PageRank scores for all nodes
   */
  calculatePagerank(config: PageRankConfig): Map<any, any>;
  /**
   * Distribute points to nodes based on PageRank scores
   */
  distributePoints(scores: Map<any, any>, total_pool: bigint): Map<any, any>;
}
/**
 * Trust configuration for Trust Aware PageRank
 */
export class TrustConfig {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Create a new TrustConfig for WASM
   */
  constructor(trusted_seeds: string[], trust_multiplier: number, trust_share: number, trust_decay: number);
  /**
   * Set trusted seeds from a Vec of addresses (WASM-compatible)
   */
  setTrustedSeeds(seeds: string[]): void;
  /**
   * Get trusted seeds as a Vec of strings (WASM-compatible)
   */
  getTrustedSeeds(): string[];
  /**
   * Weight multiplier for attestations from trusted seeds (e.g., 2.0 = 2x weight)
   */
  trustMultiplier: number;
  /**
   * Boost factor for initial scores of trusted seeds (0.0-1.0)
   */
  trustShare: number;
  /**
   * The decay factor for the trust distance degrees
   */
  trustDecay: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_trustconfig_free: (a: number, b: number) => void;
  readonly __wbg_get_trustconfig_trustMultiplier: (a: number) => number;
  readonly __wbg_set_trustconfig_trustMultiplier: (a: number, b: number) => void;
  readonly __wbg_get_trustconfig_trustShare: (a: number) => number;
  readonly __wbg_set_trustconfig_trustShare: (a: number, b: number) => void;
  readonly __wbg_get_trustconfig_trustDecay: (a: number) => number;
  readonly __wbg_set_trustconfig_trustDecay: (a: number, b: number) => void;
  readonly trustconfig_new_wasm: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly trustconfig_setTrustedSeeds: (a: number, b: number, c: number, d: number) => void;
  readonly trustconfig_getTrustedSeeds: (a: number, b: number) => void;
  readonly __wbg_pagerankconfig_free: (a: number, b: number) => void;
  readonly __wbg_get_pagerankconfig_dampingFactor: (a: number) => number;
  readonly __wbg_set_pagerankconfig_dampingFactor: (a: number, b: number) => void;
  readonly __wbg_get_pagerankconfig_maxIterations: (a: number) => number;
  readonly __wbg_set_pagerankconfig_maxIterations: (a: number, b: number) => void;
  readonly __wbg_get_pagerankconfig_tolerance: (a: number) => number;
  readonly __wbg_set_pagerankconfig_tolerance: (a: number, b: number) => void;
  readonly __wbg_get_pagerankconfig_minWeight: (a: number) => number;
  readonly __wbg_set_pagerankconfig_minWeight: (a: number, b: number) => void;
  readonly __wbg_get_pagerankconfig_maxWeight: (a: number) => number;
  readonly __wbg_set_pagerankconfig_maxWeight: (a: number, b: number) => void;
  readonly pagerankconfig_new_wasm: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly pagerankconfig_setTrustConfig: (a: number, b: number, c: number) => void;
  readonly pagerankconfig_getTrustConfig: (a: number) => number;
  readonly __wbg_pagerankgraphcomputer_free: (a: number, b: number) => void;
  readonly pagerankgraphcomputer_new_wasm: (a: number) => number;
  readonly pagerankgraphcomputer_addEdge: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly pagerankgraphcomputer_nodes: (a: number, b: number) => void;
  readonly pagerankgraphcomputer_calculatePagerank: (a: number, b: number) => number;
  readonly pagerankgraphcomputer_distributePoints: (a: number, b: number, c: number) => number;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number) => number;
  readonly __wbindgen_export_2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_4: (a: number, b: number, c: number, d: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
