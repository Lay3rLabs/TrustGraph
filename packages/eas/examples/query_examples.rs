//! # EAS Query Library Examples
//!
//! This file demonstrates how to use the wavs_eas library for querying
//! Ethereum Attestation Service data with excellent developer experience.
//!
//! Run examples with:
//! ```bash
//! cargo run --example query_examples
//! ```

use wavs_eas::query::{
    query_attestation, query_attestations_batch, query_received_attestation_count,
    query_received_attestation_uids, query_recent_received_attestations,
    query_schema_attestation_count, QueryConfig, QueryConfigBuilder,
};
use wavs_wasi_utils::evm::alloy_primitives::{Address, FixedBytes, U256};
use wstd::runtime::block_on;

#[tokio::main]
async fn main() -> Result<(), String> {
    println!("🚀 EAS Library Examples\n");

    // Example 1: Configuration Options
    configuration_examples().await?;

    // Example 2: Basic Queries
    basic_query_examples().await?;

    // Example 3: Batch Operations
    batch_query_examples().await?;

    // Example 4: Analytics Use Case
    analytics_example().await?;

    // Example 5: Voting Power Calculation
    voting_power_example().await?;

    println!("✅ All examples completed successfully!");
    Ok(())
}

/// Demonstrates different ways to configure the QueryConfig
async fn configuration_examples() -> Result<(), String> {
    println!("📝 Configuration Examples");
    println!("========================\n");

    // Method 1: Using presets
    println!("1. Using presets:");
    let _local_config = QueryConfig::local();
    println!("   ✓ Local development config created");

    let eas_addr = "0x4200000000000000000000000000000000000021"
        .parse::<Address>()
        .map_err(|e| e.to_string())?;
    let indexer_addr = "0x4200000000000000000000000000000000000022"
        .parse::<Address>()
        .map_err(|e| e.to_string())?;

    let _sepolia_config = QueryConfig::sepolia(eas_addr, indexer_addr);
    println!("   ✓ Sepolia testnet config created");

    // Method 2: From string addresses
    println!("\n2. From string addresses:");
    let _string_config = QueryConfig::from_strings(
        "0x4200000000000000000000000000000000000021",
        "0x4200000000000000000000000000000000000022",
        "https://sepolia.infura.io/v3/YOUR_API_KEY".to_string(),
    )?;
    println!("   ✓ Config created from string addresses");

    // Method 3: Builder pattern
    println!("\n3. Builder pattern:");
    let _builder_config = QueryConfigBuilder::new()
        .eas_address_str("0x4200000000000000000000000000000000000021")?
        .indexer_address_str("0x4200000000000000000000000000000000000022")?
        .rpc_endpoint("https://your-custom-rpc.com".to_string())
        .build()?;
    println!("   ✓ Config built using builder pattern");

    // Method 4: Direct construction
    println!("\n4. Direct construction:");
    let _direct_config =
        QueryConfig::new(eas_addr, indexer_addr, "https://another-rpc.com".to_string());
    println!("   ✓ Config created directly\n");

    Ok(())
}

/// Demonstrates basic querying functionality
async fn basic_query_examples() -> Result<(), String> {
    println!("🔍 Basic Query Examples");
    println!("=======================\n");

    let config = QueryConfig::local();

    // Example attestation UID (in real usage, you'd have actual UIDs)
    let example_uid = FixedBytes::<32>::from([1u8; 32]);
    let example_schema = FixedBytes::<32>::from([2u8; 32]);
    let example_address = Address::from([3u8; 20]);

    println!("1. Querying single attestation:");
    match query_attestation(example_uid, Some(config.clone())).await {
        Ok(attestation) => {
            println!("   ✓ Attestation found:");
            println!("     - UID: {}", attestation.uid);
            println!("     - Attester: {}", attestation.attester);
            println!("     - Recipient: {}", attestation.recipient);
            println!("     - Schema: {}", attestation.schema);
        }
        Err(e) => {
            println!("   ⚠️  Query failed (expected in example): {}", e);
        }
    }

    println!("\n2. Counting received attestations:");
    match query_received_attestation_count(example_address, example_schema, Some(config.clone()))
        .await
    {
        Ok(count) => {
            println!("   ✓ Found {} attestations for recipient", count);
        }
        Err(e) => {
            println!("   ⚠️  Count query failed (expected in example): {}", e);
        }
    }

    println!("\n3. Getting attestation UIDs:");
    match query_received_attestation_uids(
        example_address,
        example_schema,
        U256::from(0),  // start
        U256::from(10), // limit
        true,           // newest first
        Some(config.clone()),
    )
    .await
    {
        Ok(uids) => {
            println!("   ✓ Retrieved {} attestation UIDs", uids.len());
            for (i, uid) in uids.iter().take(3).enumerate() {
                println!("     {}. {}", i + 1, uid.uid);
            }
        }
        Err(e) => {
            println!("   ⚠️  UID query failed (expected in example): {}", e);
        }
    }

    println!();
    Ok(())
}

/// Demonstrates batch operations for efficiency
async fn batch_query_examples() -> Result<(), String> {
    println!("📦 Batch Query Examples");
    println!("=======================\n");

    let config = QueryConfig::local();

    // Create some example UIDs
    let example_uids = vec![
        FixedBytes::<32>::from([1u8; 32]),
        FixedBytes::<32>::from([2u8; 32]),
        FixedBytes::<32>::from([3u8; 32]),
    ];

    println!("1. Batch querying attestations:");
    match query_attestations_batch(example_uids.clone(), Some(config.clone())).await {
        Ok(attestations) => {
            println!("   ✓ Successfully queried {} attestations", attestations.len());
            for attestation in attestations.iter().take(2) {
                println!("     - {} -> {}", attestation.attester, attestation.recipient);
            }
        }
        Err(e) => {
            println!("   ⚠️  Batch query failed (expected in example): {}", e);
        }
    }

    println!("\n2. Querying recent attestations with convenience function:");
    let example_address = Address::from([4u8; 20]);
    let example_schema = FixedBytes::<32>::from([5u8; 32]);

    match query_recent_received_attestations(
        example_address,
        example_schema,
        5, // limit to 5 most recent
        Some(config.clone()),
    )
    .await
    {
        Ok(recent_attestations) => {
            println!("   ✓ Found {} recent attestations", recent_attestations.len());
            for attestation in recent_attestations {
                println!("     - Time: {}, From: {}", attestation.time, attestation.attester);
            }
        }
        Err(e) => {
            println!("   ⚠️  Recent query failed (expected in example): {}", e);
        }
    }

    println!();
    Ok(())
}

/// Demonstrates a real-world analytics use case
async fn analytics_example() -> Result<(), String> {
    println!("📊 Analytics Example");
    println!("===================\n");

    let config = QueryConfig::local();
    let schema_uid = FixedBytes::<32>::from([6u8; 32]);

    println!("Analyzing schema activity for schema: {}", schema_uid);

    // Step 1: Get total count
    match query_schema_attestation_count(schema_uid, Some(config.clone())).await {
        Ok(total_count) => {
            println!("1. Total attestations in schema: {}", total_count);

            // Step 2: Calculate activity metrics
            let batch_size = 50u64;
            let recent_count = total_count.min(U256::from(batch_size));

            println!("2. Analyzing {} most recent attestations...", recent_count);

            // This would normally include actual analysis of the attestation data
            println!("   ✓ Analysis complete");
            println!("   📈 Metrics calculated:");
            println!("     - Growth rate: +15% this week");
            println!("     - Top attester: 0x1234...5678");
            println!("     - Average attestation size: 128 bytes");
        }
        Err(e) => {
            println!("⚠️  Analytics failed (expected in example): {}", e);
        }
    }

    println!();
    Ok(())
}

/// Demonstrates calculating voting power based on attestations
async fn voting_power_example() -> Result<(), String> {
    println!("🗳️  Voting Power Example");
    println!("========================\n");

    let config = QueryConfig::local();
    let governance_schema = FixedBytes::<32>::from([7u8; 32]);
    let user_address = Address::from([8u8; 20]);

    println!("Calculating voting power for user: {}", user_address);

    match calculate_user_voting_power(user_address, governance_schema, config).await {
        Ok(voting_power) => {
            println!("✅ Voting power calculation complete:");
            println!("   🎯 User has {} voting tokens", voting_power.tokens);
            println!("   📊 Based on {} attestations received", voting_power.attestation_count);
            println!("   ⭐ Reputation score: {}/100", voting_power.reputation_score);

            // Determine voting eligibility
            if voting_power.tokens >= 10 {
                println!("   ✅ User is eligible to vote on governance proposals");
            } else {
                println!("   ❌ User needs {} more tokens to vote", 10 - voting_power.tokens);
            }
        }
        Err(e) => {
            println!("⚠️  Voting power calculation failed (expected in example): {}", e);
        }
    }

    println!();
    Ok(())
}

/// Represents calculated voting power for a user
#[derive(Debug)]
struct VotingPower {
    tokens: u64,
    attestation_count: u64,
    reputation_score: u8,
}

/// Calculates voting power based on received attestations
async fn calculate_user_voting_power(
    user_address: Address,
    governance_schema: FixedBytes<32>,
    config: QueryConfig,
) -> Result<VotingPower, String> {
    // Count attestations received by the user for governance schema
    let attestation_count =
        query_received_attestation_count(user_address, governance_schema, Some(config.clone()))
            .await?;

    let count_u64 = attestation_count.to::<u64>();

    // Calculate voting tokens (1 attestation = 1 token)
    let tokens = count_u64;

    // Calculate reputation score based on attestation count
    let reputation_score = match count_u64 {
        0..=5 => (count_u64 * 10) as u8,            // 0-50 points
        6..=20 => (50 + (count_u64 - 5) * 3) as u8, // 50-95 points
        _ => 100,                                   // Max 100 points
    };

    Ok(VotingPower {
        tokens,
        attestation_count: count_u64,
        reputation_score: reputation_score.min(100),
    })
}

/// Example showing how to use in a WASI component context
fn component_integration_example() -> Result<(), String> {
    println!("🔧 Component Integration Example");
    println!("================================\n");

    // This would typically be called from a WASI component's run function
    let mock_trigger_data = vec![1, 2, 3, 4]; // Mock trigger data

    let result = block_on(async move {
        // Create configuration appropriate for your deployment
        let config = QueryConfig::local(); // or from environment

        // Parse trigger data to extract attestation UID
        let attestation_uid = parse_mock_trigger_data(&mock_trigger_data)?;

        // Query the attestation
        let attestation = query_attestation(attestation_uid, Some(config)).await?;

        // Process the attestation data
        process_attestation_for_component(&attestation)?;

        Ok::<String, String>("Component processing complete".to_string())
    });

    match result {
        Ok(message) => println!("✅ {}", message),
        Err(e) => println!("❌ Component failed: {}", e),
    }

    println!();
    Ok(())
}

/// Mock function to parse trigger data
fn parse_mock_trigger_data(data: &[u8]) -> Result<FixedBytes<32>, String> {
    if data.len() < 4 {
        return Err("Invalid trigger data".to_string());
    }
    // In real implementation, this would properly decode the trigger data
    Ok(FixedBytes::<32>::from([9u8; 32]))
}

/// Mock function to process attestation data
fn process_attestation_for_component(
    attestation: &wavs_eas::query::IEAS::Attestation,
) -> Result<(), String> {
    println!("   Processing attestation {}:", attestation.uid);
    println!("   - From: {}", attestation.attester);
    println!("   - To: {}", attestation.recipient);
    println!("   - Data size: {} bytes", attestation.data.len());
    Ok(())
}
