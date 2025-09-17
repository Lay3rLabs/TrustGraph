use std::collections::{HashMap, HashSet};
use wavs_eas::query::*;
use wavs_wasi_utils::evm::alloy_primitives::{Address, FixedBytes, U256};

/// Statistical information about attestations
#[derive(Debug, Clone)]
pub struct AttestationStats {
    pub total_count: u64,
    pub unique_attesters: u64,
    pub unique_recipients: u64,
    pub unique_schemas: u64,
    pub avg_attestations_per_attester: f64,
    pub avg_attestations_per_recipient: f64,
}

/// Time-based attestation metrics
#[derive(Debug, Clone)]
pub struct TimeSeriesMetrics {
    pub attestations_by_day: HashMap<u64, u64>,
    pub peak_activity_day: u64,
    pub attestation_velocity: f64, // attestations per day average
    pub active_days: u64,
}

/// Schema analysis results
#[derive(Debug, Clone)]
pub struct SchemaAnalysis {
    pub schema_uid: FixedBytes<32>,
    pub total_attestations: u64,
    pub unique_attesters: u64,
    pub unique_recipients: u64,
    pub popularity_rank: u32,
    pub avg_attestations_per_user: f64,
}

/// Network metrics for attestation relationships
#[derive(Debug, Clone)]
pub struct NetworkMetrics {
    pub total_nodes: u64,
    pub total_edges: u64,
    pub network_density: f64,
    pub most_connected_attester: Address,
    pub most_connected_recipient: Address,
    pub clustering_coefficient: f64,
}

/// Trust/reputation score for an address
#[derive(Debug, Clone)]
pub struct ReputationScore {
    pub address: Address,
    pub score: f64,
    pub attestations_received: u64,
    pub attestations_sent: u64,
    pub unique_attesters: u64,
    pub unique_recipients: u64,
    pub schema_diversity: u64,
}

/// Activity pattern for an address
#[derive(Debug, Clone)]
pub struct ActivityPattern {
    pub address: Address,
    pub first_attestation_time: u64,
    pub last_attestation_time: u64,
    pub total_days_active: u64,
    pub avg_attestations_per_day: f64,
    pub consistency_score: f64, // measure of regular activity
}

// =============================================================================
// Statistical Analysis Functions
// =============================================================================

/// Analyzes overall attestation statistics for a given schema
pub async fn analyze_schema_statistics(
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<SchemaAnalysis, String> {
    let total_attestations = query_schema_attestation_count(schema_uid, config.clone()).await?;

    // Get all attestation UIDs for this schema (in batches if needed)
    let mut all_attesters = HashSet::new();
    let mut all_recipients = HashSet::new();
    let batch_size = 100u64;
    let mut start = 0u64;

    loop {
        let uids = query_schema_attestation_uids(
            schema_uid,
            U256::from(start),
            U256::from(batch_size),
            false,
            config.clone(),
        )
        .await?;

        if uids.is_empty() {
            break;
        }

        let uids = uids.into_iter().map(|indexed| indexed.uid).collect::<Vec<_>>();

        // Get attestation details to extract attester/recipient info
        let attestations = query_attestations_batch(uids, config.clone()).await?;

        for attestation in attestations {
            all_attesters.insert(attestation.attester);
            all_recipients.insert(attestation.recipient);
        }

        start += batch_size;

        if start >= total_attestations.to::<u64>() {
            break;
        }
    }

    let unique_attesters = all_attesters.len() as u64;
    let unique_recipients = all_recipients.len() as u64;
    let total_users = (all_attesters.len() + all_recipients.len()) as u64;

    Ok(SchemaAnalysis {
        schema_uid,
        total_attestations: total_attestations.to::<u64>(),
        unique_attesters,
        unique_recipients,
        popularity_rank: 0, // This would need to be calculated relative to other schemas
        avg_attestations_per_user: if total_users > 0 {
            total_attestations.to::<u64>() as f64 / total_users as f64
        } else {
            0.0
        },
    })
}

/// Calculates comprehensive statistics for attestations involving a specific address
pub async fn analyze_address_statistics(
    address: Address,
    config: Option<QueryConfig>,
) -> Result<AttestationStats, String> {
    let schema_uid = FixedBytes([0u8; 32]); // All schemas

    let received_count =
        query_received_attestation_count(address, schema_uid, config.clone()).await?;
    let sent_count = query_sent_attestation_count(address, schema_uid, config.clone()).await?;

    // Get unique attesters and recipients by analyzing actual attestations
    let received_uids = query_received_attestation_uids(
        address,
        schema_uid,
        U256::from(0),
        received_count,
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let sent_uids = query_sent_attestation_uids(
        address,
        schema_uid,
        U256::from(0),
        sent_count,
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let mut all_attestations = Vec::new();
    all_attestations.extend(query_attestations_batch(received_uids, config.clone()).await?);
    all_attestations.extend(query_attestations_batch(sent_uids, config).await?);

    let unique_attesters: HashSet<_> = all_attestations.iter().map(|a| a.attester).collect();
    let unique_recipients: HashSet<_> = all_attestations.iter().map(|a| a.recipient).collect();
    let unique_schemas: HashSet<_> = all_attestations.iter().map(|a| a.schema).collect();

    let total_count = (received_count + sent_count).to::<u64>();

    Ok(AttestationStats {
        total_count,
        unique_attesters: unique_attesters.len() as u64,
        unique_recipients: unique_recipients.len() as u64,
        unique_schemas: unique_schemas.len() as u64,
        avg_attestations_per_attester: if unique_attesters.len() > 0 {
            total_count as f64 / unique_attesters.len() as f64
        } else {
            0.0
        },
        avg_attestations_per_recipient: if unique_recipients.len() > 0 {
            total_count as f64 / unique_recipients.len() as f64
        } else {
            0.0
        },
    })
}

// =============================================================================
// Time Series Analysis
// =============================================================================

/// Analyzes time-based patterns in attestations for a schema
pub async fn analyze_time_series(
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<TimeSeriesMetrics, String> {
    let total_attestations = query_schema_attestation_count(schema_uid, config.clone()).await?;

    // Get all attestations for time analysis
    let uids = query_schema_attestation_uids(
        schema_uid,
        U256::from(0),
        total_attestations,
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let attestations = query_attestations_batch(uids, config).await?;

    let mut attestations_by_day: HashMap<u64, u64> = HashMap::new();
    let mut min_time = u64::MAX;
    let mut max_time = 0u64;

    for attestation in attestations {
        let day = attestation.time / 86400; // Convert to days since epoch
        *attestations_by_day.entry(day).or_insert(0) += 1;
        min_time = min_time.min(attestation.time);
        max_time = max_time.max(attestation.time);
    }

    let peak_activity_day = attestations_by_day
        .iter()
        .max_by_key(|(_, count)| *count)
        .map(|(day, _)| *day)
        .unwrap_or(0);

    let active_days = attestations_by_day.len() as u64;
    let total_days = if max_time > min_time { (max_time - min_time) / 86400 + 1 } else { 1 };

    let attestation_velocity = if total_days > 0 {
        total_attestations.to::<u64>() as f64 / total_days as f64
    } else {
        0.0
    };

    Ok(TimeSeriesMetrics {
        attestations_by_day,
        peak_activity_day,
        attestation_velocity,
        active_days,
    })
}

// =============================================================================
// Network Analysis
// =============================================================================

/// Calculates network metrics for a schema's attestation graph
pub async fn analyze_attestation_network(
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<NetworkMetrics, String> {
    let total_attestations = query_schema_attestation_count(schema_uid, config.clone()).await?;

    let uids = query_schema_attestation_uids(
        schema_uid,
        U256::from(0),
        total_attestations,
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let attestations = query_attestations_batch(uids, config).await?;

    let mut attester_connections: HashMap<Address, HashSet<Address>> = HashMap::new();
    let mut recipient_connections: HashMap<Address, HashSet<Address>> = HashMap::new();
    let mut all_nodes: HashSet<Address> = HashSet::new();

    for attestation in attestations {
        attester_connections
            .entry(attestation.attester)
            .or_insert_with(HashSet::new)
            .insert(attestation.recipient);

        recipient_connections
            .entry(attestation.recipient)
            .or_insert_with(HashSet::new)
            .insert(attestation.attester);

        all_nodes.insert(attestation.attester);
        all_nodes.insert(attestation.recipient);
    }

    let total_nodes = all_nodes.len() as u64;
    let total_edges = total_attestations.to::<u64>();

    let network_density = if total_nodes > 1 {
        (2.0 * total_edges as f64) / (total_nodes as f64 * (total_nodes as f64 - 1.0))
    } else {
        0.0
    };

    let most_connected_attester = attester_connections
        .iter()
        .max_by_key(|(_, connections)| connections.len())
        .map(|(addr, _)| *addr)
        .unwrap_or(Address::ZERO);

    let most_connected_recipient = recipient_connections
        .iter()
        .max_by_key(|(_, connections)| connections.len())
        .map(|(addr, _)| *addr)
        .unwrap_or(Address::ZERO);

    // Simple clustering coefficient calculation
    let mut clustering_sum = 0.0;
    let mut nodes_with_neighbors = 0;

    for node in &all_nodes {
        let attester_neighbors = attester_connections.get(node).cloned().unwrap_or_default();
        let recipient_neighbors = recipient_connections.get(node).cloned().unwrap_or_default();
        let all_neighbors: HashSet<_> =
            attester_neighbors.union(&recipient_neighbors).cloned().collect();

        if all_neighbors.len() >= 2 {
            let possible_edges = all_neighbors.len() * (all_neighbors.len() - 1) / 2;
            let actual_edges = count_edges_between(&all_neighbors, &attester_connections);
            clustering_sum += actual_edges as f64 / possible_edges as f64;
            nodes_with_neighbors += 1;
        }
    }

    let clustering_coefficient =
        if nodes_with_neighbors > 0 { clustering_sum / nodes_with_neighbors as f64 } else { 0.0 };

    Ok(NetworkMetrics {
        total_nodes,
        total_edges,
        network_density,
        most_connected_attester,
        most_connected_recipient,
        clustering_coefficient,
    })
}

/// Helper function to count edges between a set of nodes
fn count_edges_between(
    nodes: &HashSet<Address>,
    connections: &HashMap<Address, HashSet<Address>>,
) -> usize {
    let mut edge_count = 0;
    for node1 in nodes {
        if let Some(node1_connections) = connections.get(node1) {
            for node2 in nodes {
                if node1 != node2 && node1_connections.contains(node2) {
                    edge_count += 1;
                }
            }
        }
    }
    edge_count / 2 // Each edge is counted twice
}

// =============================================================================
// Reputation Analysis
// =============================================================================

/// Calculates a reputation score for an address based on attestation patterns
pub async fn calculate_reputation_score(
    address: Address,
    config: Option<QueryConfig>,
) -> Result<ReputationScore, String> {
    let schema_uid = FixedBytes([0u8; 32]); // All schemas

    let received_count =
        query_received_attestation_count(address, schema_uid, config.clone()).await?;
    let sent_count = query_sent_attestation_count(address, schema_uid, config.clone()).await?;

    let received_uids = query_received_attestation_uids(
        address,
        schema_uid,
        U256::from(0),
        received_count.min(U256::from(1000)), // Limit for performance
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let sent_uids = query_sent_attestation_uids(
        address,
        schema_uid,
        U256::from(0),
        sent_count.min(U256::from(1000)), // Limit for performance
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let mut all_attestations = Vec::new();
    all_attestations.extend(query_attestations_batch(received_uids, config.clone()).await?);
    all_attestations.extend(query_attestations_batch(sent_uids, config).await?);

    let unique_attesters: HashSet<_> =
        all_attestations.iter().filter(|a| a.recipient == address).map(|a| a.attester).collect();

    let unique_recipients: HashSet<_> =
        all_attestations.iter().filter(|a| a.attester == address).map(|a| a.recipient).collect();

    let unique_schemas: HashSet<_> = all_attestations.iter().map(|a| a.schema).collect();

    // Reputation score calculation (this is a simple example - could be more sophisticated)
    let base_score = (received_count.to::<u64>() as f64).log10() * 10.0;
    let diversity_bonus = (unique_schemas.len() as f64).sqrt() * 5.0;
    let network_bonus = (unique_attesters.len() as f64).log10() * 3.0;
    let activity_bonus = ((sent_count.to::<u64>() as f64) / 10.0).min(20.0);

    let score = base_score + diversity_bonus + network_bonus + activity_bonus;

    Ok(ReputationScore {
        address,
        score: score.max(0.0).min(100.0), // Normalize to 0-100 scale
        attestations_received: received_count.to::<u64>(),
        attestations_sent: sent_count.to::<u64>(),
        unique_attesters: unique_attesters.len() as u64,
        unique_recipients: unique_recipients.len() as u64,
        schema_diversity: unique_schemas.len() as u64,
    })
}

// =============================================================================
// Advanced Analytics Combinations
// =============================================================================

/// Identifies top performers in a schema by various metrics
pub async fn identify_schema_leaders(
    schema_uid: FixedBytes<32>,
    limit: u32,
    config: Option<QueryConfig>,
) -> Result<Vec<ReputationScore>, String> {
    let total_attestations = query_schema_attestation_count(schema_uid, config.clone()).await?;

    let uids = query_schema_attestation_uids(
        schema_uid,
        U256::from(0),
        total_attestations,
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let attestations = query_attestations_batch(uids, config.clone()).await?;

    // Collect all unique addresses involved in this schema
    let mut all_addresses: HashSet<Address> = HashSet::new();
    for attestation in attestations {
        all_addresses.insert(attestation.attester);
        all_addresses.insert(attestation.recipient);
    }

    let mut reputation_scores = Vec::new();

    for address in all_addresses.iter().take(limit as usize * 2) {
        // Get more than we need for better ranking
        if let Ok(score) = calculate_reputation_score(*address, config.clone()).await {
            reputation_scores.push(score);
        }
    }

    // Sort by reputation score descending
    reputation_scores
        .sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    reputation_scores.truncate(limit as usize);

    Ok(reputation_scores)
}

/// Detects suspicious patterns in attestations (e.g., potential spam or gaming)
pub async fn detect_suspicious_patterns(
    schema_uid: FixedBytes<32>,
    config: Option<QueryConfig>,
) -> Result<Vec<Address>, String> {
    let total_attestations = query_schema_attestation_count(schema_uid, config.clone()).await?;

    let uids = query_schema_attestation_uids(
        schema_uid,
        U256::from(0),
        total_attestations,
        false,
        config.clone(),
    )
    .await?
    .into_iter()
    .map(|indexed| indexed.uid)
    .collect();

    let attestations = query_attestations_batch(uids, config).await?;

    let mut attester_counts: HashMap<Address, u64> = HashMap::new();
    let mut recipient_counts: HashMap<Address, u64> = HashMap::new();
    let mut rapid_attestations: HashMap<Address, Vec<u64>> = HashMap::new();

    for attestation in attestations {
        *attester_counts.entry(attestation.attester).or_insert(0) += 1;
        *recipient_counts.entry(attestation.recipient).or_insert(0) += 1;

        rapid_attestations
            .entry(attestation.attester)
            .or_insert_with(Vec::new)
            .push(attestation.time);
    }

    let mut suspicious_addresses = Vec::new();

    // Check for excessive attestation activity (potential spam)
    let avg_attestations = total_attestations.to::<u64>() as f64 / attester_counts.len() as f64;
    let spam_threshold = avg_attestations * 10.0; // 10x average

    for (address, count) in attester_counts {
        if count as f64 > spam_threshold {
            suspicious_addresses.push(address);
        }
    }

    // Check for rapid-fire attestations (potential automation)
    for (address, timestamps) in rapid_attestations {
        let mut sorted_times = timestamps;
        sorted_times.sort();

        let mut rapid_sequences = 0;
        for window in sorted_times.windows(5) {
            if window[4] - window[0] < 300 {
                // 5 attestations within 5 minutes
                rapid_sequences += 1;
            }
        }

        if rapid_sequences > 3 && !suspicious_addresses.contains(&address) {
            suspicious_addresses.push(address);
        }
    }

    Ok(suspicious_addresses)
}

/// Analyzes attestation trends over time periods
pub async fn analyze_growth_trends(
    schema_uid: FixedBytes<32>,
    period_days: u64,
    config: Option<QueryConfig>,
) -> Result<Vec<(u64, u64, f64)>, String> {
    let time_metrics = analyze_time_series(schema_uid, config).await?;

    let mut period_data: Vec<(u64, u64, f64)> = Vec::new(); // (period_start, attestation_count, growth_rate)
    let mut sorted_days: Vec<_> = time_metrics.attestations_by_day.keys().cloned().collect();
    sorted_days.sort();

    if sorted_days.is_empty() {
        return Ok(period_data);
    }

    let start_day = sorted_days[0];
    let end_day = sorted_days[sorted_days.len() - 1];

    let mut current_period_start = start_day;
    let mut previous_count = 0u64;

    while current_period_start <= end_day {
        let period_end = current_period_start + period_days;
        let mut period_count = 0u64;

        for day in current_period_start..period_end {
            if let Some(count) = time_metrics.attestations_by_day.get(&day) {
                period_count += count;
            }
        }

        let growth_rate = if previous_count > 0 {
            ((period_count as f64 - previous_count as f64) / previous_count as f64) * 100.0
        } else if period_count > 0 {
            100.0 // First period with data is 100% growth
        } else {
            0.0
        };

        period_data.push((current_period_start, period_count, growth_rate));
        previous_count = period_count;
        current_period_start += period_days;
    }

    Ok(period_data)
}
