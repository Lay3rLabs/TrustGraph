use alloy_sol_types::sol;

// Define just the TransactionPayload we need for submitting to the blockchain
sol! {
    #[derive(Debug)]
    struct TransactionPayload {
        address to;
        uint256 value;
        bytes data;
    }
}
