//! Trust Graph Merkle Tree Utilities
//!
//! This package provides merkle tree serialization for trust graph outputs.
//! The merkle tree format is used as a storage-efficient way to prove account
//! rewards without requiring all data to be stored on-chain.

use merkle_tree_rs::standard::StandardMerkleTree;
use serde::Serialize;

/// IPFS data structure for merkle tree with account rewards
#[derive(Serialize)]
pub struct MerkleTreeIpfsData {
    /// Identifier for the merkle tree (typically the root hash)
    pub id: String,
    /// Metadata about the trust graph computation
    pub metadata: serde_json::Value,
    /// Merkle root hash
    pub root: String,
    /// Complete tree with proofs for each account
    pub tree: Vec<MerkleTreeEntry>,
}

/// Individual merkle tree entry for an account
#[derive(Serialize)]
pub struct MerkleTreeEntry {
    /// Account address
    pub account: String,
    /// Reward value for this account
    pub value: String,
    /// Merkle proof for this entry
    pub proof: Vec<String>,
}

/// Create a merkle tree from account/value pairs
///
/// # Arguments
/// * `values` - Vector of [address, amount] pairs
///
/// # Returns
/// StandardMerkleTree configured for address/uint256 pairs
pub fn create_merkle_tree(values: Vec<Vec<String>>) -> Result<StandardMerkleTree, String> {
    let tree = StandardMerkleTree::of(values, &["address".to_string(), "uint256".to_string()]);
    Ok(tree)
}

/// Build complete IPFS data structure with merkle tree and proofs
pub fn build_merkle_ipfs_data(
    tree_data: Vec<Vec<String>>,
    metadata: serde_json::Value,
) -> Result<MerkleTreeIpfsData, String> {
    let tree = create_merkle_tree(tree_data.clone())?;
    let root = tree.root();

    let mut ipfs_data = MerkleTreeIpfsData {
        id: root.clone(),
        metadata,
        root: root.clone(),
        tree: vec![],
    };

    // Generate proofs for each entry
    tree_data.into_iter().for_each(|value| {
        let proof = tree.get_proof(merkle_tree_rs::standard::LeafType::LeafBytes(value.clone()));
        ipfs_data.tree.push(MerkleTreeEntry {
            account: value[0].clone(),
            value: value[1].clone(),
            proof,
        });
    });

    Ok(ipfs_data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_merkle_tree() {
        let values = vec![
            vec!["0x1111111111111111111111111111111111111111".to_string(), "100".to_string()],
            vec!["0x2222222222222222222222222222222222222222".to_string(), "200".to_string()],
        ];

        let tree = create_merkle_tree(values).unwrap();
        assert!(!tree.root().is_empty());
    }

    #[test]
    fn test_build_merkle_ipfs_data() {
        let values = vec![
            vec!["0x1111111111111111111111111111111111111111".to_string(), "100".to_string()],
            vec!["0x2222222222222222222222222222222222222222".to_string(), "200".to_string()],
        ];

        let metadata = serde_json::json!({
            "test": "data"
        });

        let ipfs_data = build_merkle_ipfs_data(values, metadata).unwrap();
        assert_eq!(ipfs_data.tree.len(), 2);
        assert!(!ipfs_data.root.is_empty());
        assert_eq!(ipfs_data.id, ipfs_data.root);
    }
}
