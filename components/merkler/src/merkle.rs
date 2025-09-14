use merkle_tree_rs::standard::StandardMerkleTree;

/// Get a merkle tree from a list of values, formatted as [address, amount][]
pub fn get_merkle_tree(values: Vec<Vec<String>>) -> Result<StandardMerkleTree, String> {
    let tree = StandardMerkleTree::of(values, &["address".to_string(), "uint256".to_string()]);
    Ok(tree)
}
