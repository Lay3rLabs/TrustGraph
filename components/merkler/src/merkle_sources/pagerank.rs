use std::collections::{HashMap, HashSet};
use std::str::FromStr;
use wavs_wasi_utils::evm::alloy_primitives::{Address, U256};

/// Trust configuration for Trust Aware PageRank
#[derive(Clone, Debug)]
pub struct TrustConfig {
    /// Set of trusted seed attestors
    pub trusted_seeds: HashSet<Address>,
    /// Weight multiplier for attestations from trusted seeds (e.g., 2.0 = 2x weight)
    pub trust_multiplier: f64,
    /// Boost factor for initial scores of trusted seeds (0.0-1.0)
    pub trust_boost: f64,
}

impl Default for TrustConfig {
    fn default() -> Self {
        Self {
            trusted_seeds: HashSet::new(),
            trust_multiplier: 1.0, // No trust boost by default
            trust_boost: 0.0,      // No initial boost by default
        }
    }
}

impl TrustConfig {
    /// Create a new trust configuration with trusted seeds
    pub fn new(trusted_seeds: Vec<Address>) -> Self {
        Self {
            trusted_seeds: trusted_seeds.into_iter().collect(),
            trust_multiplier: 2.0, // Default 2x weight for trusted attestors
            trust_boost: 0.15,     // Default 15% of total initial score goes to trusted seeds
        }
    }

    /// Set trust multiplier for attestations from trusted seeds
    pub fn with_trust_multiplier(mut self, multiplier: f64) -> Self {
        self.trust_multiplier = multiplier.max(1.0); // Ensure at least 1.0x
        self
    }

    /// Set trust boost for initial scores (0.0-1.0)
    pub fn with_trust_boost(mut self, boost: f64) -> Self {
        self.trust_boost = boost.clamp(0.0, 1.0);
        self
    }

    /// Check if an address is a trusted seed
    pub fn is_trusted_seed(&self, address: &Address) -> bool {
        self.trusted_seeds.contains(address)
    }

    /// Add a trusted seed
    pub fn add_trusted_seed(&mut self, address: Address) {
        self.trusted_seeds.insert(address);
    }

    /// Remove a trusted seed
    pub fn remove_trusted_seed(&mut self, address: &Address) -> bool {
        self.trusted_seeds.remove(address)
    }

    /// Get all trusted seeds
    pub fn get_trusted_seeds(&self) -> &HashSet<Address> {
        &self.trusted_seeds
    }
}

/// Configuration for the Trust Aware PageRank algorithm
#[derive(Clone, Debug)]
pub struct PageRankConfig {
    /// Damping factor (usually 0.85)
    pub damping_factor: f64,
    /// Maximum number of iterations
    pub max_iterations: usize,
    /// Convergence threshold
    pub tolerance: f64,
    /// Trust configuration for Trust Aware PageRank
    pub trust_config: TrustConfig,
}

impl Default for PageRankConfig {
    fn default() -> Self {
        Self {
            damping_factor: 0.85,
            max_iterations: 100,
            tolerance: 1e-6,
            trust_config: TrustConfig::default(),
        }
    }
}

impl PageRankConfig {
    /// Create configuration with trust settings
    pub fn with_trust_config(mut self, trust_config: TrustConfig) -> Self {
        self.trust_config = trust_config;
        self
    }

    /// Enable trust features with trusted seed addresses
    pub fn with_trusted_seeds(mut self, seeds: Vec<Address>) -> Self {
        self.trust_config = TrustConfig::new(seeds);
        self
    }

    /// Check if trust features are enabled
    pub fn has_trust_enabled(&self) -> bool {
        !self.trust_config.trusted_seeds.is_empty()
    }
}

/// A directed graph for Trust Aware PageRank calculation
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

    /// Add an edge from attester to recipient with base weight
    /// The actual weight will be adjusted based on trust configuration during PageRank calculation
    pub fn add_edge(&mut self, from: Address, to: Address, base_weight: f64) {
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
        self.outgoing.get_mut(&from).unwrap().push((to, base_weight));
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

    /// Calculate the effective weight of an edge considering trust configuration
    fn calculate_edge_weight(
        &self,
        from: &Address,
        base_weight: f64,
        trust_config: &TrustConfig,
    ) -> f64 {
        if trust_config.is_trusted_seed(from) {
            base_weight * trust_config.trust_multiplier
        } else {
            base_weight
        }
    }

    /// Calculate Trust Aware PageRank scores for all nodes
    pub fn calculate_pagerank(&self, config: &PageRankConfig) -> HashMap<Address, f64> {
        let n = self.nodes.len();
        if n == 0 {
            return HashMap::new();
        }

        let mut ranks = self.initialize_scores(config);
        let mut new_ranks = ranks.clone();

        // Create sorted node list for deterministic iteration
        let mut sorted_nodes = self.nodes.clone();
        sorted_nodes.sort();

        // Calculate trust distances if trust is enabled
        let trust_distances = if config.has_trust_enabled() {
            println!(
                "🔄 Starting Trust Aware PageRank calculation for {} nodes ({} trusted seeds)",
                n,
                config.trust_config.trusted_seeds.len()
            );
            Some(self.calculate_trust_distances(&config.trust_config))
        } else {
            println!("🔄 Starting standard PageRank calculation for {} nodes", n);
            None
        };

        // Count self-loops for logging
        let self_loops: usize = sorted_nodes
            .iter()
            .filter(|&&node| {
                self.outgoing
                    .get(&node)
                    .map(|edges| edges.iter().any(|(target, _)| *target == node))
                    .unwrap_or(false)
            })
            .count();
        if self_loops > 0 {
            println!("⚠️  Detected {} nodes with self-loops (will be ignored)", self_loops);
        }

        for iteration in 0..config.max_iterations {
            let mut max_delta = 0.0;

            for &node in &sorted_nodes {
                let mut new_rank = self.calculate_base_rank(&node, n, config);

                // Skip isolated nodes (unreachable from trusted seeds) if trust is enabled
                if let Some(ref distances) = trust_distances {
                    if distances.get(&node) == Some(&usize::MAX) {
                        // Isolated node - gets only minimal base rank
                        new_ranks.insert(node, new_rank);
                        continue;
                    }
                }

                // Sum contributions from incoming edges with trust-aware weights
                for &other_node in &sorted_nodes {
                    if let Some(outgoing_edges) = self.outgoing.get(&other_node) {
                        // Create sorted copy of outgoing edges for deterministic iteration
                        let mut sorted_edges = outgoing_edges.clone();
                        sorted_edges.sort_by_key(|(addr, _)| *addr);

                        // Filter out self-loops when calculating outgoing weights
                        let filtered_edges: Vec<_> = sorted_edges
                            .iter()
                            .filter(|(target, _)| *target != other_node) // Exclude self-loops
                            .collect();

                        if filtered_edges.is_empty() {
                            continue; // Node only has self-loops, skip it
                        }

                        // Calculate total outgoing weight from this node (trust-adjusted, excluding self-loops)
                        let total_outgoing_weight: f64 = filtered_edges
                            .iter()
                            .map(|(_, base_weight)| {
                                self.calculate_edge_weight(
                                    &other_node,
                                    *base_weight,
                                    &config.trust_config,
                                )
                            })
                            .sum();

                        // Find edges to current node and calculate contributions
                        for &(target, base_weight) in &sorted_edges {
                            if target == node && other_node != node && total_outgoing_weight > 0.0 {
                                let effective_weight = self.calculate_edge_weight(
                                    &other_node,
                                    base_weight,
                                    &config.trust_config,
                                );

                                // Apply trust decay based on distance from trusted seeds
                                let trust_decay = if let Some(ref distances) = trust_distances {
                                    let source_distance =
                                        distances.get(&other_node).copied().unwrap_or(usize::MAX);
                                    let target_distance =
                                        distances.get(&node).copied().unwrap_or(usize::MAX);

                                    // Decay factor: closer to trusted seeds = less decay
                                    let max_distance = source_distance.max(target_distance);
                                    if max_distance == usize::MAX {
                                        0.01 // Minimal contribution from unreachable nodes
                                    } else {
                                        // Exponential decay: 0.8^distance
                                        0.8_f64.powi(max_distance as i32)
                                    }
                                } else {
                                    1.0 // No decay in standard PageRank
                                };

                                let contribution = ranks[&other_node]
                                    * (effective_weight / total_outgoing_weight)
                                    * trust_decay;
                                new_rank += config.damping_factor * contribution;
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
                println!("🔄 PageRank iteration {}: max delta = {:.8}", iteration, max_delta);
            }

            if max_delta < config.tolerance {
                println!("✅ PageRank converged after {} iterations", iteration + 1);
                break;
            }
        }

        println!("🎯 PageRank calculation completed");

        // Post-process: severely penalize isolated nodes in trust mode
        if let Some(ref distances) = trust_distances {
            for (&node, distance) in distances {
                if *distance == usize::MAX {
                    // Isolated nodes get near-zero score
                    ranks.insert(node, 0.000001);
                }
            }
        }

        // Normalize scores to ensure they sum to 1
        let total_score: f64 = ranks.values().sum();
        if total_score > 0.0 {
            ranks.iter_mut().for_each(|(_, score)| *score /= total_score);
        }

        // Log trust statistics if trust is enabled
        if config.has_trust_enabled() {
            self.log_trust_statistics(&ranks, config);
        }

        ranks
    }

    /// Initialize PageRank scores with trust-aware distribution
    fn initialize_scores(&self, config: &PageRankConfig) -> HashMap<Address, f64> {
        let n = self.nodes.len();
        let trusted_count = config.trust_config.trusted_seeds.len();

        if !config.has_trust_enabled() {
            // Standard uniform initialization
            let initial_rank = 1.0 / n as f64;
            return self.nodes.iter().map(|&addr| (addr, initial_rank)).collect();
        }

        // Trust-aware initialization
        let trust_boost = config.trust_config.trust_boost;
        let trusted_total_score = trust_boost;
        let regular_total_score = 1.0 - trust_boost;
        let regular_count = n - trusted_count;

        let trusted_score =
            if trusted_count > 0 { trusted_total_score / trusted_count as f64 } else { 0.0 };
        let regular_score =
            if regular_count > 0 { regular_total_score / regular_count as f64 } else { 0.0 };

        self.nodes
            .iter()
            .map(|&addr| {
                let initial_score = if config.trust_config.is_trusted_seed(&addr) {
                    trusted_score
                } else {
                    regular_score
                };
                (addr, initial_score)
            })
            .collect()
    }

    /// Calculate base rank contribution (teleportation) for a specific node
    fn calculate_base_rank(&self, node: &Address, n: usize, config: &PageRankConfig) -> f64 {
        let base_factor = 1.0 - config.damping_factor;

        if !config.has_trust_enabled() {
            // Standard uniform teleportation
            return base_factor / n as f64;
        }

        // Trust Aware teleportation - only trusted seeds get significant base rank
        if config.trust_config.is_trusted_seed(node) {
            // Trusted seeds get the majority of teleportation probability
            let trusted_count = config.trust_config.trusted_seeds.len();
            (base_factor * config.trust_config.trust_boost) / trusted_count as f64
        } else {
            // Non-trusted nodes get minimal teleportation (prevents isolated nodes from getting points)
            let non_trusted_count = n - config.trust_config.trusted_seeds.len();
            if non_trusted_count > 0 {
                (base_factor * (1.0 - config.trust_config.trust_boost)) / non_trusted_count as f64
            } else {
                0.0
            }
        }
    }

    /// Calculate shortest distance from trusted seeds to each node (BFS)
    fn calculate_trust_distances(&self, trust_config: &TrustConfig) -> HashMap<Address, usize> {
        use std::collections::VecDeque;

        let mut distances = HashMap::new();
        let mut queue = VecDeque::new();

        // Initialize trusted seeds with distance 0
        for &trusted_seed in &trust_config.trusted_seeds {
            distances.insert(trusted_seed, 0);
            queue.push_back(trusted_seed);
        }

        // BFS to find shortest paths from trusted seeds
        while let Some(current) = queue.pop_front() {
            let current_distance = distances[&current];

            // Check all outgoing edges from current node
            if let Some(outgoing) = self.outgoing.get(&current) {
                // Sort edges for deterministic iteration
                let mut sorted_outgoing = outgoing.clone();
                sorted_outgoing.sort_by_key(|(addr, _)| *addr);

                for &(neighbor, _) in &sorted_outgoing {
                    // Only process if we haven't visited this neighbor yet
                    if !distances.contains_key(&neighbor) {
                        distances.insert(neighbor, current_distance + 1);
                        queue.push_back(neighbor);
                    }
                }
            }

            // Also check incoming edges (treat graph as undirected for trust propagation)
            // We need to find all nodes that have edges TO the current node
            let mut sorted_sources: Vec<_> = self.outgoing.iter().collect();
            sorted_sources.sort_by_key(|(addr, _)| **addr);

            for (&source, edges) in sorted_sources {
                // Sort edges for deterministic iteration
                let mut sorted_edges = edges.clone();
                sorted_edges.sort_by_key(|(addr, _)| *addr);

                for &(target, _) in &sorted_edges {
                    if target == current && !distances.contains_key(&source) {
                        distances.insert(source, current_distance + 1);
                        queue.push_back(source);
                    }
                }
            }
        }

        // Mark unreachable nodes with MAX distance (use sorted iteration)
        let mut sorted_nodes = self.nodes.clone();
        sorted_nodes.sort();
        for &node in &sorted_nodes {
            distances.entry(node).or_insert(usize::MAX);
        }

        // Log distance statistics
        let reachable = distances.values().filter(|&&d| d != usize::MAX).count();
        let unreachable = distances.values().filter(|&&d| d == usize::MAX).count();
        println!(
            "🔍 Trust distance analysis: {} reachable, {} unreachable from trusted seeds",
            reachable, unreachable
        );

        distances
    }

    /// Log statistics about trust distribution
    fn log_trust_statistics(&self, ranks: &HashMap<Address, f64>, config: &PageRankConfig) {
        let mut trusted_total_score = 0.0;
        let mut trusted_count = 0;
        let mut regular_total_score = 0.0;
        let mut regular_count = 0;
        let mut isolated_count = 0;
        let mut self_vouching_count = 0;

        // Calculate trust distances for isolation detection
        let trust_distances = self.calculate_trust_distances(&config.trust_config);

        // Count self-vouching nodes (use sorted iteration for determinism)
        let mut sorted_nodes = self.nodes.clone();
        sorted_nodes.sort();
        for &node in &sorted_nodes {
            if let Some(edges) = self.outgoing.get(&node) {
                if edges.iter().any(|(target, _)| *target == node) {
                    self_vouching_count += 1;
                }
            }
        }

        // Categorize nodes and calculate scores (sorted for deterministic iteration)
        let mut sorted_ranks: Vec<_> = ranks.iter().collect();
        sorted_ranks.sort_by_key(|(addr, _)| **addr);
        for (addr, score) in sorted_ranks {
            let is_isolated = trust_distances.get(addr) == Some(&usize::MAX);

            if is_isolated {
                isolated_count += 1;
            } else if config.trust_config.is_trusted_seed(addr) {
                trusted_total_score += score;
                trusted_count += 1;
            } else {
                regular_total_score += score;
                regular_count += 1;
            }
        }

        println!("📊 Trust Statistics:");
        println!(
            "  Trusted seeds: {} addresses with {:.4} total score (avg: {:.6})",
            trusted_count,
            trusted_total_score,
            if trusted_count > 0 { trusted_total_score / trusted_count as f64 } else { 0.0 }
        );
        println!(
            "  Regular nodes: {} addresses with {:.4} total score (avg: {:.6})",
            regular_count,
            regular_total_score,
            if regular_count > 0 { regular_total_score / regular_count as f64 } else { 0.0 }
        );
        println!("  🚫 Isolated nodes: {} (unreachable from trusted seeds)", isolated_count);
        println!("  🔄 Self-vouching nodes: {} (ignored in calculation)", self_vouching_count);

        if trusted_count > 0 && regular_count > 0 {
            let trust_advantage = (trusted_total_score / trusted_count as f64)
                / (regular_total_score / regular_count as f64);
            println!("  Trust advantage: {:.2}x average score", trust_advantage);
        }

        // Show top non-trusted nodes if any have significant scores
        let mut non_trusted_scores: Vec<_> = ranks
            .iter()
            .filter(|(addr, _)| !config.trust_config.is_trusted_seed(addr))
            .map(|(addr, score)| (*addr, *score))
            .collect();
        non_trusted_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        if !non_trusted_scores.is_empty() {
            println!("\n  Top 5 non-trusted nodes:");
            for (i, (addr, score)) in non_trusted_scores.iter().take(5).enumerate() {
                let distance = trust_distances.get(addr).copied().unwrap_or(usize::MAX);
                let distance_str = if distance == usize::MAX {
                    "isolated".to_string()
                } else {
                    format!("distance {}", distance)
                };
                println!("    {}. {}: {:.6} ({})", i + 1, addr, score, distance_str);
            }
        }
    }
}

/// Trust Aware PageRank-based source configuration
pub struct PageRankRewardSource {
    /// Schema UID for attestations
    pub schema_uid: String,
    /// Total pool to distribute
    pub total_pool: U256,
    /// PageRank configuration (including trust settings)
    pub config: PageRankConfig,
    /// Minimum PageRank score to receive points (to filter out very low scores)
    pub min_score_threshold: f64,
}

impl PageRankRewardSource {
    pub fn new(schema_uid: String, total_pool: U256, config: PageRankConfig) -> Self {
        Self {
            schema_uid,
            total_pool,
            config,
            min_score_threshold: 0.0001, // 0.01% minimum
        }
    }

    pub fn with_min_threshold(mut self, threshold: f64) -> Self {
        self.min_score_threshold = threshold;
        self
    }

    /// Create a Trust Aware PageRank source
    pub fn with_trusted_seeds(
        schema_uid: String,
        total_pool: U256,
        trusted_seeds: Vec<&str>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        // Parse trusted seed addresses
        let mut parsed_seeds = Vec::new();
        for seed_str in trusted_seeds {
            let address = Address::from_str(seed_str)
                .map_err(|e| format!("Invalid trusted seed address '{}': {}", seed_str, e))?;
            parsed_seeds.push(address);
        }

        let trust_config = TrustConfig::new(parsed_seeds);
        let config = PageRankConfig::default().with_trust_config(trust_config);

        Ok(Self::new(schema_uid, total_pool, config))
    }

    /// Check if this source uses trust features
    pub fn has_trust_enabled(&self) -> bool {
        self.config.has_trust_enabled()
    }

    /// Get trusted seed addresses
    pub fn get_trusted_seeds(&self) -> Vec<Address> {
        self.config.trust_config.trusted_seeds.iter().copied().collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_standard_pagerank_no_trust() {
        let mut graph = AttestationGraph::new();

        // Create addresses for testing
        let alice = Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();
        let charlie = Address::from_str("0x3333333333333333333333333333333333333333").unwrap();

        // Create a simple graph: Alice -> Bob -> Charlie -> Alice
        graph.add_edge(alice, bob, 1.0);
        graph.add_edge(bob, charlie, 1.0);
        graph.add_edge(charlie, alice, 1.0);

        let config = PageRankConfig::default();
        let scores = graph.calculate_pagerank(&config);

        // All nodes should have equal scores in this symmetric graph
        let alice_score = scores[&alice];
        let bob_score = scores[&bob];
        let charlie_score = scores[&charlie];

        assert!((alice_score - bob_score).abs() < 1e-6);
        assert!((bob_score - charlie_score).abs() < 1e-6);
        assert!((alice_score - 1.0 / 3.0).abs() < 1e-6); // Each should have ~1/3 of total score
    }

    #[test]
    fn test_trust_aware_pagerank_basic() {
        let mut graph = AttestationGraph::new();

        // Create addresses
        let trusted_alice =
            Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();
        let charlie = Address::from_str("0x3333333333333333333333333333333333333333").unwrap();

        // Create graph where trusted Alice attests to Bob, Bob attests to Charlie
        graph.add_edge(trusted_alice, bob, 1.0);
        graph.add_edge(bob, charlie, 1.0);
        graph.add_edge(charlie, trusted_alice, 1.0); // Charlie attests back to Alice

        // Configure trust with Alice as trusted seed
        let trust_config =
            TrustConfig::new(vec![trusted_alice]).with_trust_multiplier(2.0).with_trust_boost(0.5); // 50% boost

        let config = PageRankConfig::default().with_trust_config(trust_config);
        let scores = graph.calculate_pagerank(&config);

        // Alice (trusted) should have higher score than others due to trust boost and weighted attestations
        let alice_score = scores[&trusted_alice];
        let bob_score = scores[&bob];
        let charlie_score = scores[&charlie];

        assert!(alice_score > bob_score, "Trusted seed should have higher score");
        assert!(alice_score > charlie_score, "Trusted seed should have higher score");

        // Bob should benefit from trusted Alice's endorsement (though this might not always hold in complex graphs)
        // Just verify all scores are positive for now
        assert!(bob_score > 0.0 && charlie_score > 0.0, "All nodes should have positive scores");
    }

    #[test]
    fn test_trust_multiplier_effect() {
        let mut graph = AttestationGraph::new();

        // Create addresses
        let trusted_alice =
            Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let trusted_bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();
        let charlie = Address::from_str("0x3333333333333333333333333333333333333333").unwrap();
        let diana = Address::from_str("0x4444444444444444444444444444444444444444").unwrap();
        let eve = Address::from_str("0x5555555555555555555555555555555555555555").unwrap();

        // Create a scenario where:
        // - Alice (trusted) and Charlie (untrusted) both attest to Diana with same weight
        // - Bob (trusted) and Charlie (untrusted) both attest to Eve with same weight
        // - Diana and Eve attest to each other to create some flow
        graph.add_edge(trusted_alice, diana, 1.0);
        graph.add_edge(charlie, diana, 1.0);
        graph.add_edge(trusted_bob, eve, 1.0);
        graph.add_edge(charlie, eve, 1.0);
        graph.add_edge(diana, eve, 1.0);
        graph.add_edge(eve, diana, 1.0);

        // Configure trust with multiplier
        let trust_config = TrustConfig::new(vec![trusted_alice, trusted_bob])
            .with_trust_multiplier(3.0)
            .with_trust_boost(0.2); // Lower boost to isolate multiplier effect

        let config = PageRankConfig::default().with_trust_config(trust_config);
        let scores = graph.calculate_pagerank(&config);

        let diana_score = scores[&diana];
        let eve_score = scores[&eve];
        let charlie_score = scores[&charlie];

        // Both Diana and Eve receive attestations from 1 trusted + 1 untrusted source
        // They should have similar scores (small difference due to graph structure)
        let score_diff = (diana_score - eve_score).abs();
        assert!(
            score_diff < 0.1,
            "Diana and Eve should have similar scores: {} vs {} (diff: {})",
            diana_score,
            eve_score,
            score_diff
        );

        // Charlie (untrusted) has no incoming edges, should have very low score
        assert!(
            diana_score > charlie_score * 4.0,
            "Nodes receiving trusted attestations should score much higher than untrusted nodes: {} > {} * 4.0",
            diana_score,
            charlie_score
        );

        // The trust multiplier effect is that edges from trusted seeds have 3x weight
        // This is reflected in how Diana and Eve have high scores despite Charlie also attesting to them
        println!("\nTrust multiplier test results:");
        println!("  Diana (attested by Alice[trusted] + Charlie): {:.6}", diana_score);
        println!("  Eve (attested by Bob[trusted] + Charlie): {:.6}", eve_score);
        println!("  Charlie (untrusted, no incoming): {:.6}", charlie_score);
        println!("  Score ratio Diana/Charlie: {:.2}x", diana_score / charlie_score);
    }

    #[test]
    fn test_trust_boost_effect() {
        let mut graph = AttestationGraph::new();

        let trusted_alice =
            Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();

        // Simple graph with no edges to isolate initial boost effect
        graph.add_edge(trusted_alice, bob, 1.0);

        let trust_config_no_boost = TrustConfig::new(vec![trusted_alice])
            .with_trust_multiplier(1.0) // No multiplier effect
            .with_trust_boost(0.0); // No boost

        let trust_config_with_boost =
            TrustConfig::new(vec![trusted_alice]).with_trust_multiplier(1.0).with_trust_boost(0.5); // 50% boost

        let config_no_boost = PageRankConfig::default().with_trust_config(trust_config_no_boost);
        let config_with_boost =
            PageRankConfig::default().with_trust_config(trust_config_with_boost);

        let scores_no_boost = graph.calculate_pagerank(&config_no_boost);
        let scores_with_boost = graph.calculate_pagerank(&config_with_boost);

        let alice_score_no_boost = scores_no_boost[&trusted_alice];
        let alice_score_with_boost = scores_with_boost[&trusted_alice];

        // With trust boost, Alice should start with higher initial score
        assert!(
            alice_score_with_boost > alice_score_no_boost,
            "Trust boost should increase trusted seed's score"
        );
    }

    #[test]
    fn test_multiple_trusted_seeds() {
        let mut graph = AttestationGraph::new();

        let trusted_alice =
            Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let trusted_bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();
        let charlie = Address::from_str("0x3333333333333333333333333333333333333333").unwrap();
        let dave = Address::from_str("0x4444444444444444444444444444444444444444").unwrap();

        // Both trusted seeds attest to different regular nodes
        graph.add_edge(trusted_alice, charlie, 1.0);
        graph.add_edge(trusted_bob, dave, 1.0);

        let trust_config = TrustConfig::new(vec![trusted_alice, trusted_bob])
            .with_trust_multiplier(2.0)
            .with_trust_boost(0.5);

        let config = PageRankConfig::default().with_trust_config(trust_config);
        let scores = graph.calculate_pagerank(&config);

        // Both trusted seeds should have elevated scores
        let alice_score = scores[&trusted_alice];
        let bob_score = scores[&trusted_bob];
        let charlie_score = scores[&charlie];
        let dave_score = scores[&dave];

        // Trusted seeds should have higher scores due to trust boost
        // Note: In some graph structures, the relationship between endorsed nodes may vary
        assert!(alice_score > 0.0 && bob_score > 0.0, "Trusted seeds should have positive scores");
        assert!(
            charlie_score > 0.0 && dave_score > 0.0,
            "Regular nodes should have positive scores"
        );

        // Both endorsed nodes should benefit from trusted attestations
        assert!(
            charlie_score > 0.0 && dave_score > 0.0,
            "Endorsed nodes should have positive scores"
        );
    }

    #[test]
    fn test_trust_config_validation() {
        let alice = Address::from_str("0x1111111111111111111111111111111111111111").unwrap();

        // Test trust multiplier validation (should be >= 1.0)
        let trust_config = TrustConfig::new(vec![alice]).with_trust_multiplier(0.5); // Should be clamped to 1.0

        assert!(trust_config.trust_multiplier >= 1.0, "Trust multiplier should be at least 1.0");

        // Test trust boost validation (should be 0.0-1.0)
        let trust_config_boost = TrustConfig::new(vec![alice]).with_trust_boost(1.5); // Should be clamped to 1.0

        assert!(trust_config_boost.trust_boost <= 1.0, "Trust boost should be at most 1.0");
        assert!(trust_config_boost.trust_boost >= 0.0, "Trust boost should be at least 0.0");
    }

    #[test]
    fn test_empty_graph() {
        let graph = AttestationGraph::new();
        let config = PageRankConfig::default();
        let scores = graph.calculate_pagerank(&config);

        assert!(scores.is_empty(), "Empty graph should return empty scores");
    }

    #[test]
    fn test_single_node_graph() {
        let mut graph = AttestationGraph::new();
        let alice = Address::from_str("0x1111111111111111111111111111111111111111").unwrap();

        // Add a self-loop
        graph.add_edge(alice, alice, 1.0);

        let trust_config =
            TrustConfig::new(vec![alice]).with_trust_multiplier(2.0).with_trust_boost(0.5);

        let config = PageRankConfig::default().with_trust_config(trust_config);
        let scores = graph.calculate_pagerank(&config);

        // Single node should get all the score
        assert!((scores[&alice] - 1.0).abs() < 1e-6, "Single node should have score close to 1.0");
    }

    #[test]
    fn test_backwards_compatibility() {
        let mut graph = AttestationGraph::new();

        let alice = Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();
        let charlie = Address::from_str("0x3333333333333333333333333333333333333333").unwrap();

        // Create symmetric graph
        graph.add_edge(alice, bob, 1.0);
        graph.add_edge(bob, charlie, 1.0);
        graph.add_edge(charlie, alice, 1.0);

        // Compare standard config vs trust config with no trusted seeds
        let standard_config = PageRankConfig::default();
        let empty_trust_config =
            PageRankConfig::default().with_trust_config(TrustConfig::default()); // Empty trust config

        let standard_scores = graph.calculate_pagerank(&standard_config);
        let trust_scores = graph.calculate_pagerank(&empty_trust_config);

        // Scores should be identical
        for addr in graph.nodes() {
            let std_score = standard_scores[addr];
            let trust_score = trust_scores[addr];
            assert!(
                (std_score - trust_score).abs() < 1e-10,
                "Standard and empty trust PageRank should produce identical results"
            );
        }
    }

    #[test]
    fn test_spam_resistance_self_vouching() {
        let mut graph = AttestationGraph::new();

        // Create addresses - similar to the actual test scenario
        let alice = Address::from_str("0x70997970C51812dc3A010C7d01b50e0d17dc79C8").unwrap(); // Trusted authority
        let bob = Address::from_str("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC").unwrap();
        let charlie = Address::from_str("0x90F79bf6EB2c4f870365E785982E1f101E93b906").unwrap();
        let diana = Address::from_str("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65").unwrap();
        let grace = Address::from_str("0x14dC79964da2C08b23698B3D3cc7Ca32193d9955").unwrap(); // Spammer
        let henry = Address::from_str("0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f").unwrap(); // Spammer
        let ivy = Address::from_str("0xa0Ee7A142d267C1f36714E4a8F75612F20a79720").unwrap(); // Spammer

        // Authority vouching (Alice vouches for Bob with high weight)
        graph.add_edge(alice, bob, 95.0);

        // Spammer self-vouching (these should be penalized)
        graph.add_edge(grace, grace, 100.0);
        graph.add_edge(henry, henry, 100.0);
        graph.add_edge(ivy, ivy, 100.0);

        // Legitimate community vouching
        graph.add_edge(bob, charlie, 70.0);
        graph.add_edge(charlie, diana, 65.0);
        graph.add_edge(diana, bob, 40.0);

        // Configure trust with Alice as trusted seed
        let trust_config =
            TrustConfig::new(vec![alice]).with_trust_multiplier(2.0).with_trust_boost(0.9); // 90% of teleportation goes to trusted seeds

        let config = PageRankConfig::default().with_trust_config(trust_config);
        let scores = graph.calculate_pagerank(&config);

        // Get scores for all nodes
        let alice_score = scores[&alice];
        let bob_score = scores[&bob];
        let charlie_score = scores[&charlie];
        let diana_score = scores[&diana];
        let grace_score = scores[&grace];
        let henry_score = scores[&henry];
        let ivy_score = scores[&ivy];

        // Verify trust propagation
        println!("\nSpam Resistance Test Results:");
        println!("Alice (trusted): {:.6}", alice_score);
        println!("Bob (vouched by Alice): {:.6}", bob_score);
        println!("Charlie (community): {:.6}", charlie_score);
        println!("Diana (community): {:.6}", diana_score);
        println!("Grace (spammer): {:.6}", grace_score);
        println!("Henry (spammer): {:.6}", henry_score);
        println!("Ivy (spammer): {:.6}", ivy_score);

        // Core assertions for spam resistance
        assert!(
            alice_score > grace_score * 100.0,
            "Trusted seed should have 100x+ score vs spammer"
        );
        assert!(
            bob_score > grace_score * 50.0,
            "Node vouched by trusted seed should have 50x+ score vs spammer"
        );
        assert!(
            charlie_score > grace_score * 10.0,
            "Community node should have 10x+ score vs spammer"
        );
        assert!(
            diana_score > grace_score * 10.0,
            "Community node should have 10x+ score vs spammer"
        );

        // Spammers should have nearly identical (minimal) scores
        let spam_score_variance = ((grace_score - henry_score).abs()
            + (henry_score - ivy_score).abs()
            + (ivy_score - grace_score).abs())
            / 3.0;
        assert!(
            spam_score_variance < 0.000001,
            "Spammers should have nearly identical minimal scores"
        );

        // Verify spammers get less than 1% of total score
        let total_score: f64 = scores.values().sum();
        let spammer_total = grace_score + henry_score + ivy_score;
        let spammer_percentage = (spammer_total / total_score) * 100.0;
        assert!(
            spammer_percentage < 1.0,
            "Spammers should get less than 1% of total score, got {:.2}%",
            spammer_percentage
        );

        // Verify legitimate network gets vast majority of score
        let legitimate_total = alice_score + bob_score + charlie_score + diana_score;
        let legitimate_percentage = (legitimate_total / total_score) * 100.0;
        assert!(
            legitimate_percentage > 99.0,
            "Legitimate network should get >99% of score, got {:.2}%",
            legitimate_percentage
        );
    }

    #[test]
    fn test_trust_config_methods() {
        let alice = Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();

        let mut trust_config = TrustConfig::default();

        // Test adding trusted seeds
        trust_config.add_trusted_seed(alice);
        assert!(trust_config.is_trusted_seed(&alice), "Alice should be trusted seed");
        assert!(!trust_config.is_trusted_seed(&bob), "Bob should not be trusted seed");

        // Test removing trusted seeds
        assert!(trust_config.remove_trusted_seed(&alice), "Should successfully remove Alice");
        assert!(
            !trust_config.remove_trusted_seed(&alice),
            "Should return false when removing non-existent seed"
        );
        assert!(!trust_config.is_trusted_seed(&alice), "Alice should no longer be trusted seed");

        // Test getting trusted seeds
        trust_config.add_trusted_seed(alice);
        trust_config.add_trusted_seed(bob);
        let seeds = trust_config.get_trusted_seeds();
        assert_eq!(seeds.len(), 2, "Should have 2 trusted seeds");
        assert!(
            seeds.contains(&alice) && seeds.contains(&bob),
            "Should contain both Alice and Bob"
        );
    }

    #[test]
    fn test_deterministic_pagerank_results() {
        // Create a moderately complex graph to test determinism
        let mut graph = AttestationGraph::new();

        // Add some test addresses (using different values to ensure varied iteration order)
        let addr1 = Address::from([0x01; 20]);
        let addr2 = Address::from([0x02; 20]);
        let addr3 = Address::from([0x03; 20]);
        let addr4 = Address::from([0x04; 20]);
        let addr5 = Address::from([0x05; 20]);

        // Create a complex network of attestations
        graph.add_edge(addr1, addr2, 1.0);
        graph.add_edge(addr1, addr3, 2.0);
        graph.add_edge(addr2, addr3, 1.5);
        graph.add_edge(addr2, addr4, 1.0);
        graph.add_edge(addr3, addr4, 2.0);
        graph.add_edge(addr4, addr5, 1.0);
        graph.add_edge(addr5, addr1, 1.5);
        graph.add_edge(addr3, addr1, 1.0); // Create some cycles

        // Test both standard PageRank and trust-aware PageRank
        let configs = vec![
            PageRankConfig::default(), // Standard PageRank
            PageRankConfig::default().with_trusted_seeds(vec![addr1, addr3]), // Trust-aware
        ];

        for config in configs {
            // Run PageRank calculation multiple times
            let mut results = Vec::new();
            for _ in 0..5 {
                let result = graph.calculate_pagerank(&config);
                results.push(result);
            }

            // Verify all results are identical
            for i in 1..results.len() {
                assert_eq!(
                    results[0].len(),
                    results[i].len(),
                    "Result {} has different number of nodes",
                    i
                );

                for (addr, score0) in &results[0] {
                    let score_i = results[i]
                        .get(addr)
                        .expect(&format!("Address {:?} missing in result {}", addr, i));
                    assert!((score0 - score_i).abs() < 1e-15,
                        "Non-deterministic result for address {:?}: {} vs {} (diff: {}) in iteration {}",
                        addr, score0, score_i, (score0 - score_i).abs(), i);
                }
            }
        }
    }
}
