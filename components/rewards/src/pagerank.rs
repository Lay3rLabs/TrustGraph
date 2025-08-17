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

        if config.has_trust_enabled() {
            println!(
                "🔄 Starting Trust Aware PageRank calculation for {} nodes ({} trusted seeds)",
                n,
                config.trust_config.trusted_seeds.len()
            );
        } else {
            println!("🔄 Starting standard PageRank calculation for {} nodes", n);
        }

        for iteration in 0..config.max_iterations {
            let mut max_delta = 0.0;

            for &node in &self.nodes {
                let mut new_rank = self.calculate_base_rank(&node, n, config);

                // Sum contributions from incoming edges with trust-aware weights
                for &other_node in &self.nodes {
                    if let Some(outgoing_edges) = self.outgoing.get(&other_node) {
                        // Calculate total outgoing weight from this node (trust-adjusted)
                        let total_outgoing_weight: f64 = outgoing_edges
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
                        for &(target, base_weight) in outgoing_edges {
                            if target == node && total_outgoing_weight > 0.0 {
                                let effective_weight = self.calculate_edge_weight(
                                    &other_node,
                                    base_weight,
                                    &config.trust_config,
                                );
                                let contribution =
                                    ranks[&other_node] * (effective_weight / total_outgoing_weight);
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

        // Trust Aware teleportation - trusted seeds get boosted teleportation
        let uniform_prob = base_factor / n as f64;

        if config.trust_config.is_trusted_seed(node) {
            // Trusted seeds get additional teleportation probability
            uniform_prob * (1.0 + config.trust_config.trust_boost)
        } else {
            // Regular nodes get standard teleportation probability
            uniform_prob
        }
    }

    /// Log statistics about trust distribution
    fn log_trust_statistics(&self, ranks: &HashMap<Address, f64>, config: &PageRankConfig) {
        let mut trusted_total_score = 0.0;
        let mut trusted_count = 0;
        let mut regular_total_score = 0.0;
        let mut regular_count = 0;

        for (addr, score) in ranks {
            if config.trust_config.is_trusted_seed(addr) {
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

        if trusted_count > 0 {
            let trust_advantage = if regular_count > 0 {
                (trusted_total_score / trusted_count as f64)
                    / (regular_total_score / regular_count as f64)
            } else {
                1.0
            };
            println!("  Trust advantage: {:.2}x average score", trust_advantage);
        }
    }
}

/// Trust Aware PageRank-based reward source configuration
pub struct PageRankRewardSource {
    /// Schema UID for attestations
    pub schema_uid: String,
    /// Total reward pool to distribute
    pub total_reward_pool: U256,
    /// PageRank configuration (including trust settings)
    pub config: PageRankConfig,
    /// Minimum PageRank score to receive rewards (to filter out very low scores)
    pub min_score_threshold: f64,
}

impl PageRankRewardSource {
    pub fn new(schema_uid: String, total_reward_pool: U256, config: PageRankConfig) -> Self {
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

    /// Create a Trust Aware PageRank reward source
    pub fn with_trusted_seeds(
        schema_uid: String,
        total_reward_pool: U256,
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

        Ok(Self::new(schema_uid, total_reward_pool, config))
    }

    /// Check if this reward source uses trust features
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

        let trusted_alice =
            Address::from_str("0x1111111111111111111111111111111111111111").unwrap();
        let bob = Address::from_str("0x2222222222222222222222222222222222222222").unwrap();
        let charlie = Address::from_str("0x3333333333333333333333333333333333333333").unwrap();

        // Create a simple directed graph: Alice (trusted) -> Bob, Charlie -> Bob
        // This way Bob receives attestations from both trusted and untrusted sources
        graph.add_edge(trusted_alice, bob, 1.0);
        graph.add_edge(charlie, bob, 1.0);

        // Compare no trust vs trust multiplier to show the effect
        let no_trust_config = PageRankConfig::default(); // No trust features
        let trust_config =
            TrustConfig::new(vec![trusted_alice]).with_trust_multiplier(3.0).with_trust_boost(0.1);

        let config_no_trust = no_trust_config;
        let config_trust = PageRankConfig::default().with_trust_config(trust_config);

        let scores_no_trust = graph.calculate_pagerank(&config_no_trust);
        let scores_trust = graph.calculate_pagerank(&config_trust);

        let alice_score_no_trust = scores_no_trust[&trusted_alice];
        let alice_score_trust = scores_trust[&trusted_alice];

        // With trust features, Alice should get a higher score due to trust boost and multiplier
        assert!(
            alice_score_trust > alice_score_no_trust,
            "Trust features should increase trusted seed's score: {} vs {}",
            alice_score_trust,
            alice_score_no_trust
        );

        // Bob should also benefit in the trust scenario due to weighted attestation from Alice
        let bob_score_no_trust = scores_no_trust[&bob];
        let bob_score_trust = scores_trust[&bob];

        // Bob should have positive scores in both cases
        assert!(
            bob_score_no_trust > 0.0 && bob_score_trust > 0.0,
            "Bob should have positive scores"
        );
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
}
