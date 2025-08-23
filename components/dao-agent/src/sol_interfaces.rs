use alloy_sol_types::sol;

// Define just the TransactionPayload we need for submitting to the blockchain
sol! {
    #[derive(Debug)]
    enum Operation {
      Call,
      DelegateCall
    }

    /// @dev Single transaction to execute
    #[derive(Debug)]
    struct Transaction {
        address target; // Target address for the transaction
        uint256 value; // ETH value to send
        bytes data; // Calldata for the transaction
        Operation operation; // Operation type (Call or DelegateCall)
    }

    /// @dev Main payload structure for WAVS envelope
    #[derive(Debug)]
    struct TransactionPayload {
        uint256 nonce; // Nonce for tracking/ordering
        Transaction[] transactions; // Array of transactions to execute
        string description; // Optional description of the batch
    }
}
