use merkle_tree_rs::standard::StandardMerkleTree;
use serde::Serialize;

// {
//     "id": "A string id of the Merkle tree, can be random (you can use the root)",
//     "metadata": {
//       "info": "a key value mapping allowing you to add information"
//     },
//     "root": "The merkle root of the tree",
//     "tree": [
//       {
//         "account": "The address of the account",
//         "value": "The value associated with the account",
//         "proof": ["0x1...", "0x2...", "...", "0xN..."]
//       }
//     ]
//   }
#[derive(Serialize)]
pub struct MerkleTreeIpfsData {
    pub id: String,
    pub metadata: serde_json::Value,
    pub root: String,
    pub tree: Vec<MerkleTreeEntry>,
}

#[derive(Serialize)]
pub struct MerkleTreeEntry {
    pub account: String,
    pub value: String,
    pub proof: Vec<String>,
}

/// Get a merkle tree from a list of values, formatted as [address, amount][]
pub fn get_merkle_tree(values: Vec<Vec<String>>) -> Result<StandardMerkleTree, String> {
    let tree = StandardMerkleTree::of(values, &["address".to_string(), "uint256".to_string()]);
    Ok(tree)
}
