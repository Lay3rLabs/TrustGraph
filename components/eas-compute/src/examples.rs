//! # EAS Analytics Examples
//!
//! This module provides comprehensive examples of how to use the EAS query and analytics
//! functions for complex attestation data analysis. These examples demonstrate various
//! use cases from simple queries to advanced network analysis.

use crate::analytics::*;
use crate::query::*;
use crate::solidity::{Operation, OperationType, VotingPowerPayload};
use wavs_wasi_utils::evm::alloy_primitives::{Address, FixedBytes, U256};

// =============================================================================
// Example 1: Basic Attestation Analytics
// =============================================================================

/// Example: Analyze basic attestation metrics for an address
pub async fn example_basic_address_analysis(address: Address) -> Result<(), String> {
    println!("=== Basic Address Analysis for {} ===", address);

    // Get basic statistics
    let stats = analyze_address_statistics(address, None).await?;

    println!("Total attestations: {}", stats.total_count);
    println!("Unique attesters: {}", stats.unique_attesters);
    println!("Unique recipients: {}", stats.unique_recipients);
    println!("Schema diversity: {}", stats.unique_schemas);
    println!("Avg attestations per attester: {:.2}", stats.avg_attestations_per_attester);

    // Calculate reputation score
    let reputation = calculate_reputation_score(address, None).await?;

    println!("Reputation score: {:.2}/100", reputation.score);
    println!("Attestations received: {}", reputation.attestations_received);
    println!("Attestations sent: {}", reputation.attestations_sent);

    Ok(())
}

// =============================================================================
// Example 2: Schema Popularity Analysis
// =============================================================================

/// Example: Analyze the popularity and usage patterns of a schema
pub async fn example_schema_popularity_analysis(schema_uid: FixedBytes<32>) -> Result<(), String> {
    println!("=== Schema Popularity Analysis for {} ===", schema_uid);

    // Get schema statistics
    let schema_analysis = analyze_schema_statistics(schema_uid, None).await?;

    println!("Total attestations: {}", schema_analysis.total_attestations);
    println!("Unique attesters: {}", schema_analysis.unique_attesters);
    println!("Unique recipients: {}", schema_analysis.unique_recipients);
    println!("Avg attestations per user: {:.2}", schema_analysis.avg_attestations_per_user);

    // Analyze time series patterns
    let time_metrics = analyze_time_series(schema_uid, None).await?;

    println!("Active days: {}", time_metrics.active_days);
    println!("Peak activity day: {}", time_metrics.peak_activity_day);
    println!("Attestation velocity: {:.2} per day", time_metrics.attestation_velocity);

    // Check network metrics
    let network = analyze_attestation_network(schema_uid, None).await?;

    println!("Network nodes: {}", network.total_nodes);
    println!("Network density: {:.4}", network.network_density);
    println!("Most connected attester: {}", network.most_connected_attester);
    println!("Clustering coefficient: {:.4}", network.clustering_coefficient);

    Ok(())
}

// =============================================================================
// Example 3: Trust Network Analysis
// =============================================================================

/// Example: Analyze trust relationships and identify key players
pub async fn example_trust_network_analysis(schema_uid: FixedBytes<32>) -> Result<(), String> {
    println!("=== Trust Network Analysis for {} ===", schema_uid);

    // Identify top performers
    let leaders = identify_schema_leaders(schema_uid, 10, None).await?;

    println!("Top 10 addresses by reputation:");
    for (i, leader) in leaders.iter().enumerate() {
        println!(
            "{}. {} - Score: {:.2}, Received: {}, Sent: {}, Diversity: {}",
            i + 1,
            leader.address,
            leader.score,
            leader.attestations_received,
            leader.attestations_sent,
            leader.schema_diversity
        );
    }

    // Detect suspicious patterns
    let suspicious = detect_suspicious_patterns(schema_uid, None).await?;

    if !suspicious.is_empty() {
        println!("\nPotentially suspicious addresses:");
        for addr in suspicious {
            println!("- {}", addr);
        }
    } else {
        println!("\nNo suspicious patterns detected.");
    }

    Ok(())
}

// =============================================================================
// Example 4: Growth and Trend Analysis
// =============================================================================

/// Example: Analyze growth trends over time periods
pub async fn example_growth_trend_analysis(schema_uid: FixedBytes<32>) -> Result<(), String> {
    println!("=== Growth Trend Analysis for {} ===", schema_uid);

    // Analyze weekly growth trends
    let weekly_trends = analyze_growth_trends(schema_uid, 7, None).await?;

    println!("Weekly Growth Trends:");
    println!("Week Start | Attestations | Growth Rate");
    println!("-----------|--------------|------------");

    for (week_start, count, growth) in weekly_trends.iter() {
        let date = format_timestamp(*week_start * 86400); // Convert back to timestamp
        println!("{} | {:>12} | {:>9.2}%", date, count, growth);
    }

    // Analyze monthly trends
    let monthly_trends = analyze_growth_trends(schema_uid, 30, None).await?;

    println!("\nMonthly Growth Trends:");
    println!("Month Start | Attestations | Growth Rate");
    println!("------------|--------------|------------");

    for (month_start, count, growth) in monthly_trends.iter() {
        let date = format_timestamp(*month_start * 86400);
        println!("{} | {:>12} | {:>9.2}%", date, count, growth);
    }

    Ok(())
}

// =============================================================================
// Example 5: Advanced Voting Power Calculation
// =============================================================================

/// Example: Calculate sophisticated voting power based on multiple factors
pub async fn example_advanced_voting_power(
    recipient: Address,
    schema_uid: FixedBytes<32>,
) -> Result<VotingPowerPayload, String> {
    println!("=== Advanced Voting Power Calculation for {} ===", recipient);

    // Get comprehensive metrics
    let reputation = calculate_reputation_score(recipient, None).await?;
    let received_count = query_received_attestation_count(recipient, schema_uid, None).await?;

    // Get recent activity (last 30 attestations)
    let recent_attestations =
        query_recent_received_attestations(recipient, schema_uid, 30, None).await?;

    // Calculate time-based factors
    let mut recency_bonus = 0.0;
    let current_time =
        std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();

    for attestation in &recent_attestations {
        let age_days = (current_time - attestation.time) / 86400;
        if age_days <= 30 {
            recency_bonus += (30.0 - age_days as f64) / 30.0; // Linear decay over 30 days
        }
    }

    // Calculate final voting power with multiple factors
    let base_power = received_count.to::<u64>() as f64;
    let reputation_multiplier = (reputation.score / 100.0).max(0.1); // Min 10% of base
    let recency_multiplier = 1.0 + (recency_bonus / 10.0); // Up to 3x bonus for recent activity
    let diversity_bonus = (reputation.schema_diversity as f64).sqrt(); // Square root scaling

    let final_voting_power =
        (base_power * reputation_multiplier * recency_multiplier + diversity_bonus) as u64;

    println!("Base attestations: {}", received_count);
    println!("Reputation score: {:.2}", reputation.score);
    println!("Recency bonus: {:.2}", recency_bonus);
    println!("Schema diversity: {}", reputation.schema_diversity);
    println!("Final voting power: {}", final_voting_power);

    // Create voting power payload
    let mint_operation = Operation {
        operationType: OperationType::MINT,
        account: recipient,
        target: Address::ZERO,
        amount: U256::from(final_voting_power),
    };

    Ok(VotingPowerPayload { operations: vec![mint_operation] })
}

// =============================================================================
// Example 6: Multi-Schema Analysis
// =============================================================================

/// Example: Compare performance across multiple schemas
pub async fn example_multi_schema_comparison(
    schemas: Vec<FixedBytes<32>>,
    address: Address,
) -> Result<(), String> {
    println!("=== Multi-Schema Analysis for {} ===", address);

    let mut schema_scores = Vec::new();

    for schema in schemas {
        // Get attestation count for this schema
        let count = query_received_attestation_count(address, schema, None).await?;

        // Get recent attestations
        let recent = query_recent_received_attestations(address, schema, 10, None).await?;

        // Calculate schema-specific metrics
        let unique_attesters: std::collections::HashSet<_> =
            recent.iter().map(|a| a.attester).collect();

        let avg_time_between = if recent.len() > 1 {
            let mut times: Vec<_> = recent.iter().map(|a| a.time).collect();
            times.sort();
            let total_span = times.last().unwrap() - times.first().unwrap();
            total_span as f64 / (times.len() - 1) as f64
        } else {
            0.0
        };

        schema_scores.push((schema, count.to::<u64>(), unique_attesters.len(), avg_time_between));
    }

    // Sort by attestation count descending
    schema_scores.sort_by(|a, b| b.1.cmp(&a.1));

    println!("Schema Performance Ranking:");
    println!("Rank | Schema | Count | Unique Attesters | Avg Time Between");
    println!("-----|--------|-------|------------------|------------------");

    for (i, (schema, count, unique, avg_time)) in schema_scores.iter().enumerate() {
        println!(
            "{:>4} | {} | {:>5} | {:>16} | {:>13.1}h",
            i + 1,
            format!("{}..{}", &format!("{}", schema)[0..8], &format!("{}", schema)[56..64]),
            count,
            unique,
            avg_time / 3600.0 // Convert to hours
        );
    }

    Ok(())
}

// =============================================================================
// Example 7: Fraud Detection Pipeline
// =============================================================================

/// Example: Comprehensive fraud detection analysis
pub async fn example_fraud_detection_pipeline(schema_uid: FixedBytes<32>) -> Result<(), String> {
    println!("=== Fraud Detection Pipeline for {} ===", schema_uid);

    // Step 1: Detect suspicious patterns
    let suspicious_addresses = detect_suspicious_patterns(schema_uid, None).await?;

    println!("Found {} potentially suspicious addresses", suspicious_addresses.len());

    // Step 2: Analyze each suspicious address in detail
    for addr in suspicious_addresses.iter().take(5) {
        // Limit to first 5 for example
        println!("\n--- Analyzing suspicious address: {} ---", addr);

        let reputation = calculate_reputation_score(*addr, None).await?;
        let sent_count = query_sent_attestation_count(*addr, schema_uid, None).await?;
        let received_count = query_received_attestation_count(*addr, schema_uid, None).await?;

        // Check for unusual patterns
        let sent_to_received_ratio = if received_count > U256::ZERO {
            sent_count.to::<u64>() as f64 / received_count.to::<u64>() as f64
        } else {
            f64::INFINITY
        };

        println!("Reputation score: {:.2}", reputation.score);
        println!("Sent attestations: {}", sent_count);
        println!("Received attestations: {}", received_count);
        println!("Send/Receive ratio: {:.2}", sent_to_received_ratio);

        // Get recent sent attestations to check timing
        let recent_sent = query_recent_sent_attestations(*addr, schema_uid, 20, None).await?;

        if recent_sent.len() > 5 {
            let mut times: Vec<_> = recent_sent.iter().map(|a| a.time).collect();
            times.sort();

            let mut rapid_sequences = 0;
            for window in times.windows(5) {
                if window[4] - window[0] < 300 {
                    // 5 attestations within 5 minutes
                    rapid_sequences += 1;
                }
            }

            println!("Rapid sequence count: {}", rapid_sequences);

            if rapid_sequences > 0 {
                println!("⚠️  ALERT: Potential bot-like behavior detected");
            }
        }

        // Check recipient diversity
        let unique_recipients: std::collections::HashSet<_> =
            recent_sent.iter().map(|a| a.recipient).collect();

        let recipient_diversity = unique_recipients.len() as f64 / recent_sent.len() as f64;
        println!("Recipient diversity: {:.2}", recipient_diversity);

        if recipient_diversity < 0.3 {
            println!("⚠️  ALERT: Low recipient diversity (possible sybil attack)");
        }
    }

    Ok(())
}

// =============================================================================
// Example 8: Community Health Analysis
// =============================================================================

/// Example: Analyze overall community health metrics
pub async fn example_community_health_analysis(schema_uid: FixedBytes<32>) -> Result<(), String> {
    println!("=== Community Health Analysis for {} ===", schema_uid);

    // Get network metrics
    let network = analyze_attestation_network(schema_uid, None).await?;
    let time_metrics = analyze_time_series(schema_uid, None).await?;
    let schema_stats = analyze_schema_statistics(schema_uid, None).await?;

    // Calculate health metrics
    let participation_rate = schema_stats.unique_attesters as f64 / network.total_nodes as f64;
    let network_centralization = 1.0 - network.clustering_coefficient; // Higher clustering = less centralized
    let activity_consistency = time_metrics.active_days as f64
        / ((time_metrics.attestations_by_day.keys().max().unwrap_or(&0)
            - time_metrics.attestations_by_day.keys().min().unwrap_or(&0))
            + 1) as f64;

    println!("Community Health Metrics:");
    println!("- Network size: {} nodes", network.total_nodes);
    println!("- Network density: {:.4}", network.network_density);
    println!("- Participation rate: {:.2}%", participation_rate * 100.0);
    println!("- Network centralization: {:.4}", network_centralization);
    println!("- Activity consistency: {:.2}%", activity_consistency * 100.0);
    println!("- Daily velocity: {:.2} attestations/day", time_metrics.attestation_velocity);

    // Health score calculation (0-100)
    let health_score = ((network.network_density * 25.0)
        + (participation_rate * 25.0)
        + ((1.0 - network_centralization) * 25.0)
        + (activity_consistency * 25.0))
        .min(100.0);

    println!("\n🏥 Overall Community Health Score: {:.1}/100", health_score);

    // Recommendations based on metrics
    if health_score < 40.0 {
        println!("\n❌ Community health is poor. Recommendations:");
    } else if health_score < 70.0 {
        println!("\n⚠️  Community health is moderate. Recommendations:");
    } else {
        println!("\n✅ Community health is good!");
    }

    if participation_rate < 0.3 {
        println!("- Increase incentives for new attesters to join");
    }
    if network.network_density < 0.1 {
        println!("- Encourage more cross-connections between community members");
    }
    if network_centralization > 0.8 {
        println!("- Work to decentralize attestation patterns");
    }
    if activity_consistency < 0.5 {
        println!("- Implement programs to encourage regular engagement");
    }

    Ok(())
}

// =============================================================================
// Utility Functions
// =============================================================================

/// Helper function to format timestamps for display
fn format_timestamp(timestamp: u64) -> String {
    use std::time::UNIX_EPOCH;

    let _datetime = UNIX_EPOCH + std::time::Duration::from_secs(timestamp);

    // For simplicity, just return the timestamp as a string
    // In a real implementation, you'd use a proper datetime library
    format!("Day {}", timestamp / 86400)
}

/// Example function to demonstrate all analytics capabilities
pub async fn run_complete_analysis_example() -> Result<(), String> {
    println!("🔍 Running Complete EAS Analytics Example\n");

    // Example addresses and schema (replace with real values)
    let example_address = Address::from([1u8; 20]); // Example address
    let example_schema = FixedBytes([2u8; 32]); // Example schema
    let additional_schemas =
        vec![FixedBytes([3u8; 32]), FixedBytes([4u8; 32]), FixedBytes([5u8; 32])];

    // Run all example analyses
    println!("1. Basic address analysis:");
    if let Err(e) = example_basic_address_analysis(example_address).await {
        println!("   Error: {}", e);
    }

    println!("\n2. Schema popularity analysis:");
    if let Err(e) = example_schema_popularity_analysis(example_schema).await {
        println!("   Error: {}", e);
    }

    println!("\n3. Trust network analysis:");
    if let Err(e) = example_trust_network_analysis(example_schema).await {
        println!("   Error: {}", e);
    }

    println!("\n4. Growth trend analysis:");
    if let Err(e) = example_growth_trend_analysis(example_schema).await {
        println!("   Error: {}", e);
    }

    println!("\n5. Advanced voting power calculation:");
    match example_advanced_voting_power(example_address, example_schema).await {
        Ok(payload) => {
            println!("   Voting power payload created with {} operations", payload.operations.len())
        }
        Err(e) => println!("   Error: {}", e),
    }

    println!("\n6. Multi-schema comparison:");
    if let Err(e) = example_multi_schema_comparison(additional_schemas, example_address).await {
        println!("   Error: {}", e);
    }

    println!("\n7. Fraud detection pipeline:");
    if let Err(e) = example_fraud_detection_pipeline(example_schema).await {
        println!("   Error: {}", e);
    }

    println!("\n8. Community health analysis:");
    if let Err(e) = example_community_health_analysis(example_schema).await {
        println!("   Error: {}", e);
    }

    println!("\n✅ Complete analysis example finished!");
    Ok(())
}
