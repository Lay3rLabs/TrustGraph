use alloy_sol_macro::sol;

sol!("../../src/interfaces/ITypes.sol");
pub use ITypes::*;

sol!("../../src/interfaces/IWavsIndexer.sol");
pub use IWavsIndexer::EventIndexed;

sol!("../../src/interfaces/merkle/IMerkler.sol");
pub use IMerkler::*;
