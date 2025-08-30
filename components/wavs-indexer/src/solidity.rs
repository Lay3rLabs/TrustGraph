use alloy_sol_macro::sol;

// WAVS Indexer contract types - import from the interface
sol!(
    #![sol(extra_derives(serde::Serialize, serde::Deserialize))]
    "../../src/interfaces/IWavsIndexer.sol"
);

// Re-export the types for convenience
pub use IWavsIndexer::*;

sol!("../../src/interfaces/IIndexedEvents.sol");
