# Zodiac Module Integration

This project includes Gnosis Safe integration with custom Zodiac modules for enhanced governance and control capabilities.

## Overview

Zodiac is a modular framework for Gnosis Safe that allows extending Safe functionality through modules. Our implementation includes two core modules:

1. **MerkleGovModule** - Provides merkle-based governance with proposal creation and voting
2. **SignerManagerModule** - Manages Safe signers and threshold programmatically

## Architecture

```
┌─────────────────┐
│   Gnosis Safe   │
│                 │
│  ┌───────────┐  │
│  │  Modules  │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Merkle │ │ Signer  │
│  Gov  │ │ Manager │
└───┬───┘ └─────────┘
    │
    └─── WAVS Integration
```

## Modules

### MerkleGovModule

A sophisticated governance module that enables merkle-proof based voting and proposal execution through the Safe.

**Key Features:**
- Merkle-based voting power verification
- Proposal creation with multiple actions
- Support for Against, For, and Abstain votes
- Integrates with WAVS for merkle root updates
- Configurable governance parameters (voting delay, period, quorum)
- Time-bound voting periods
- Safe execution of successful proposals

**Functions:**
- `propose(address[] targets, uint256[] values, bytes[] calldatas, Operation[] operations, string description)` - Create a new proposal
- `castVote(uint256 proposalId, VoteType voteType, uint256 votingPower, address rewardToken, bytes32[] proof)` - Cast a vote with merkle proof
- `execute(uint256 proposalId)` - Execute a successful proposal
- `cancel(uint256 proposalId)` - Cancel a proposal (proposer or owner only)
- `state(uint256 proposalId)` - Get current state of a proposal
- `getActions(uint256 proposalId)` - View proposal actions
- `hasVoted(uint256 proposalId, address account)` - Check if address has voted

**Governance Parameters (Owner-controlled):**
- `setQuorum(uint256 newQuorum)` - Update quorum requirement
- `setVotingDelay(uint256 newDelay)` - Update voting delay
- `setVotingPeriod(uint256 newPeriod)` - Update voting period

**WAVS Integration:**
- `handleSignedEnvelope(Envelope envelope, SignatureData signatureData)` - Update merkle root via WAVS

### SignerManagerModule

Manages Safe signers and threshold settings programmatically.

**Key Features:**
- Add/remove Safe signers
- Swap signers
- Change threshold requirements
- Query current signers and threshold
- WAVS integration for automated signer management

**Functions:**
- `addSigner(address signer, uint256 newThreshold)` - Add a new signer
- `removeSigner(address prevSigner, address signer, uint256 newThreshold)` - Remove a signer
- `swapSigner(address prevSigner, address oldSigner, address newSigner)` - Replace a signer
- `changeThreshold(uint256 newThreshold)` - Update threshold
- `getSigners()` - View current signers
- `getThreshold()` - View current threshold

## Deployment

### Automatic Deployment

The modules are automatically deployed and enabled as part of the main deployment script:

```bash
./script/deploy-contracts.sh
```

This will:
1. Deploy two Gnosis Safes with single signer (deployer) and threshold of 1
2. Deploy MerkleGovModule and SignerManagerModule for each Safe
3. **Automatically enable both modules on each Safe**
4. Save deployment addresses to `.docker/zodiac_safes_deploy.json`

**Note:** Safes are deployed with only the deployer as initial signer to allow automatic module enablement. Additional signers can be added after deployment using the SignerManagerModule.

### Manual Deployment

To deploy Safes with Zodiac modules separately:

```bash
forge script script/DeployZodiacSafes.s.sol:DeployZodiacSafes \
    --rpc-url <RPC_URL> \
    --private-key <PRIVATE_KEY> \
    --broadcast
```

## Module Enablement

**✅ Modules are automatically enabled during deployment!** No manual enablement is required.

The deployment script automatically:
1. Deploys Safes with single signer (deployer)
2. Deploys and enables both modules on each Safe
3. Leaves Safes ready for additional signers to be added

## Usage Examples

### Create Proposal via MerkleGovModule

```solidity
// Create a proposal to transfer funds
address[] memory targets = new address[](1);
targets[0] = recipient;

uint256[] memory values = new uint256[](1);
values[0] = 1 ether;

bytes[] memory calldatas = new bytes[](1);
calldatas[0] = "";

Operation[] memory operations = new Operation[](1);
operations[0] = Operation.Call;

uint256 proposalId = merkleGovModule.propose(
    targets,
    values,
    calldatas,
    operations,
    "Transfer 1 ETH to recipient"
);
```

### Cast Vote with Merkle Proof

```solidity
// Vote on a proposal with merkle proof
bytes32[] memory proof = getMerkleProof(voter); // Get proof from off-chain

merkleGovModule.castVote(
    proposalId,
    MerkleGovModule.VoteType.For,
    1000e18,        // voting power
    rewardToken,    // token address (part of merkle leaf)
    proof           // merkle proof
);
```

### Execute Successful Proposal

```solidity
// After voting period ends and proposal succeeded
merkleGovModule.execute(proposalId);
```

### Add Signer via SignerManagerModule

```solidity
// After module is enabled on the Safe
signerModule.addSigner(
    newSignerAddress,
    3  // new threshold
);
```

### Remove Signer

```solidity
signerModule.removeSigner(
    prevSignerInList,  // address that points to signer in linked list
    signerToRemove,
    2  // new threshold
);
```

## Governance Flow

1. **Merkle Root Update**: WAVS service updates the merkle root containing voting power data
2. **Proposal Creation**: Anyone can create a proposal with the current merkle root
3. **Voting Period**: Users vote using merkle proofs to verify their voting power
4. **Execution**: After voting ends, successful proposals can be executed

## Testing

Run module tests:

```bash
forge test --match-contract MerkleGovModule -vv
forge test --match-contract SignerManagerModule -vv
```

Test specific functionality:

```bash
forge test --match-test test_MerkleGov_CreateProposal -vvv
forge test --match-test test_MerkleGov_VoteWithProof -vvv
forge test --match-test test_SignerModule_GetCurrentSigners -vvv
```

## Security Considerations

1. **Module Ownership:** Modules have an owner who can execute privileged functions. Ensure proper ownership management.

2. **Module Enablement:** Enabling a module gives it significant control over the Safe. Only enable trusted modules.

3. **Threshold Management:** When using SignerManagerModule to change signers or threshold, ensure you don't lock yourself out.

4. **Merkle Root Updates:** MerkleGovModule relies on WAVS for merkle root updates. Ensure the WAVS service is properly configured and secured.

5. **Proposal Validation:** Review proposal actions carefully before voting, as executed proposals perform actions directly through the Safe.

6. **Voting Power:** Voting power is determined by the merkle tree data. Ensure the off-chain process generating merkle trees is secure and accurate.

## Deployment Artifacts

After deployment, the following files are created:

- `.docker/zodiac_safes_deploy.json` - Deployment addresses and configuration (includes module enablement status)
- `.docker/deployment_summary.json` - Complete deployment summary including Zodiac modules
- Modules are already enabled, so no enablement transaction files are needed

## Troubleshooting

### Module Not Enabled Error (GS104)

This error should not occur with the new deployment as modules are auto-enabled. If you see this error, verify module status using:

```bash
cast call <SAFE_ADDRESS> 'isModuleEnabled(address)(bool)' <MODULE_ADDRESS>
```

Or use the management script:
```bash
./script/manage-safe-signers.sh
# Select option 7 to verify module status
```

### Invalid Signer Address (GS203)

Safe rejects certain addresses as signers (e.g., 0x0, 0x1). Ensure you're using valid Ethereum addresses.

### Module Already Initialized

Modules can only be initialized once. If you see this error, the module has already been set up.

### Invalid Merkle Proof

Ensure your merkle proof matches the current merkle root stored in the module and that the leaf data is correctly formatted.

## Integration with WAVS

The Zodiac modules are deeply integrated with the WAVS (WebAssembly Verification Service) system:

- **MerkleGovModule** receives merkle root updates via WAVS for voting power verification
- **SignerManagerModule** can execute automated signer updates based on WAVS computations
- Both modules implement `IWavsServiceHandler` for receiving validated data

## Governance Parameters

### MerkleGovModule Parameters

- **Voting Delay**: 1 block (default) - Delay before voting starts
- **Voting Period**: 50,400 blocks (~1 week at 12s blocks) - Duration of voting
- **Quorum**: 4% (default) - Minimum participation required

These can be adjusted by the module owner to suit your governance needs.

## Further Resources

- [Zodiac Documentation](https://github.com/gnosis/zodiac)
- [Gnosis Safe Documentation](https://docs.safe.global)
- [Safe SDK](https://github.com/safe-global/safe-sdk)
- [EAS Integration Guide](./EAS_INTEGRATION.md)
- [WAVS Documentation](./WAVS_INTEGRATION.md)