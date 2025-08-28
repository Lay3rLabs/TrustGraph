use alloy_sol_macro::sol;

// WAVS Indexer contract types - import from the interface
sol!(
    #![sol(extra_derives(serde::Serialize, serde::Deserialize))]
    "../../src/interfaces/IWavsIndexer.sol"
);

// Re-export the types for convenience
pub use IWavsIndexer::*;

// TODO: move these to interfaces or import from each place or what? maybe each transformer defines its own events?
// Common event types we'll handle
sol! {
    // EAS events
    event AttestationAttested(address indexed eas, bytes32 indexed uid);
    event AttestationRevoked(address indexed eas, bytes32 indexed uid);

    // Governance events
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        string[] signatures,
        bytes[] calldatas,
        uint256 startBlock,
        uint256 endBlock,
        string description
    );

    event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason);

    // Custom events from your contracts
    event NewTrigger(bytes _triggerInfo);
    event UpdateService(string json);
}
