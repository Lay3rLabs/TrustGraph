use std::collections::HashMap;
use wavs_wasi_utils::evm::alloy_primitives::Address;

/// Configuration for the PageRank algorithm
#[derive(Clone, Debug)]
pub struct PageRankConfig {
    /// Damping factor (usually 0.85)
    pub damping_factor: f64,
    /// Maximum number of iterations
    pub max_iterations: usize,
    /// Convergence threshold
    pub tolerance: f64,
}

impl Default for PageRankConfig {
    fn default() -> Self {
        Self { damping_factor: 0.85, max_iterations: 100, tolerance: 1e-6 }
    }
}

/// A directed graph for PageRank calculation
#[derive(Debug, Clone)]
pub struct AttestationGraph {
    /// Adjacency list: node -> list of outgoing edges with weights
    outgoing: HashMap<Address, Vec<(Address, f64)>>,
    /// Incoming edges count for each node
    incoming: HashMap<Address, usize>,
    /// All nodes in the graph
    nodes: Vec<Address>,
}

impl AttestationGraph {
    pub fn new() -> Self {
        Self { outgoing: HashMap::new(), incoming: HashMap::new(), nodes: Vec::new() }
    }

    /// Add an edge from attester to recipient with given weight
    pub fn add_edge(&mut self, from: Address, to: Address, weight: f64) {
        // Add nodes if they don't exist
        if !self.outgoing.contains_key(&from) {
            self.outgoing.insert(from, Vec::new());
            if !self.nodes.contains(&from) {
                self.nodes.push(from);
            }
        }
        if !self.incoming.contains_key(&to) {
            self.incoming.insert(to, 0);
            if !self.nodes.contains(&to) {
                self.nodes.push(to);
            }
        }

        // Add the edge
        self.outgoing.get_mut(&from).unwrap().push((to, weight));
        *self.incoming.get_mut(&to).unwrap() += 1;
    }

    /// Get all nodes in the graph
    pub fn nodes(&self) -> &Vec<Address> {
        &self.nodes
    }

    /// Get outgoing edges from a node
    pub fn get_outgoing(&self, node: &Address) -> Option<&Vec<(Address, f64)>> {
        self.outgoing.get(node)
    }

    /// Calculate PageRank scores for all nodes
    pub fn calculate_pagerank(&self, config: &PageRankConfig) -> HashMap<Address, f64> {
        let n = self.nodes.len();
        if n == 0 {
            return HashMap::new();
        }

        let initial_rank = 1.0 / n as f64;
        let mut ranks: HashMap<Address, f64> =
            self.nodes.iter().map(|&addr| (addr, initial_rank)).collect();
        let mut new_ranks = ranks.clone();

        println!("🔄 Starting PageRank calculation for {} nodes", n);

        for iteration in 0..config.max_iterations {
            let mut max_delta = 0.0;

            for &node in &self.nodes {
                let mut new_rank = (1.0 - config.damping_factor) / n as f64;

                // Sum contributions from incoming edges
                for &other_node in &self.nodes {
                    if let Some(outgoing_edges) = self.outgoing.get(&other_node) {
                        // Find edge to current node
                        for &(target, weight) in outgoing_edges {
                            if target == node {
                                let outgoing_weight_sum: f64 =
                                    outgoing_edges.iter().map(|(_, w)| *w).sum();
                                if outgoing_weight_sum > 0.0 {
                                    let contribution =
                                        ranks[&other_node] * (weight / outgoing_weight_sum);
                                    new_rank += config.damping_factor * contribution;
                                }
                            }
                        }
                    }
                }

                let delta = (new_rank - ranks[&node]).abs();
                if delta > max_delta {
                    max_delta = delta;
                }

                new_ranks.insert(node, new_rank);
            }

            ranks = new_ranks.clone();

            if iteration % 10 == 0 {
                println!("🔄 PageRank iteration {}: max delta = {:.6}", iteration, max_delta);
            }

            if max_delta < config.tolerance {
                println!("✅ PageRank converged after {} iterations", iteration + 1);
                break;
            }
        }

        println!("🎯 PageRank calculation completed");

        // Normalize scores to ensure they sum to 1
        let total_score: f64 = ranks.values().sum();
        if total_score > 0.0 {
            ranks.iter_mut().for_each(|(_, score)| *score /= total_score);
        }

        ranks
    }
}

/// PageRank-based reward source configuration
pub struct PageRankRewardSource {
    /// Schema UID for attestations
    pub schema_uid: String,
    /// Total reward pool to distribute
    pub total_reward_pool: wavs_wasi_utils::evm::alloy_primitives::U256,
    /// PageRank configuration
    pub config: PageRankConfig,
    /// Minimum PageRank score to receive rewards (to filter out very low scores)
    pub min_score_threshold: f64,
}

impl PageRankRewardSource {
    pub fn new(
        schema_uid: String,
        total_reward_pool: wavs_wasi_utils::evm::alloy_primitives::U256,
        config: PageRankConfig,
    ) -> Self {
        Self {
            schema_uid,
            total_reward_pool,
            config,
            min_score_threshold: 0.0001, // 0.01% minimum
        }
    }

    pub fn with_min_threshold(mut self, threshold: f64) -> Self {
        self.min_score_threshold = threshold;
        self
    }
}
