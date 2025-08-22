# Zodiac Module Integration

This project includes Gnosis Safe integration with custom Zodiac modules for enhanced governance and control capabilities.

## Overview

Zodiac is a modular framework for Gnosis Safe that allows extending Safe functionality through modules. Our implementation includes two core modules:

1. **BasicZodiacModule** - Provides basic transaction execution capabilities
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
│ Basic │ │ Signer  │
│Module │ │ Manager │
└───────┘ └─────────┘
```

## Modules

### BasicZodiacModule

A foundational module that enables programmatic transaction execution through the Safe.

**Key Features:**
- Execute transactions through the Safe
- Owner-controlled operations
- Support for both call and delegatecall operations

**Functions:**
- `executeTransaction(address to, uint256 value, bytes data, Operation operation)` - Execute a transaction
- `executeTransactionReturnData(...)` - Execute and return transaction data
- `setUpModule(address avatar, address target)` - Reconfigure module targets

### SignerManagerModule

Manages Safe signers and threshold settings programmatically.

**Key Features:**
- Add/remove Safe signers
- Swap signers
- Change threshold requirements
- Query current signers and threshold

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
2. Deploy BasicZodiacModule and SignerManagerModule for each Safe
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

### Execute Transaction via BasicModule

```solidity
// After module is enabled on the Safe
basicModule.executeTransaction(
    recipient,    // to address
    1 ether,      // value
    "",           // data
    Operation.Call // operation type
);
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

## Testing

Run module tests:

```bash
forge test --match-contract ZodiacModules -vv
```

Test specific functionality:

```bash
forge test --match-test test_BasicModule_Setup -vvv
forge test --match-test test_SignerModule_GetCurrentSigners -vvv
```

## Security Considerations

1. **Module Ownership:** Modules have an owner who can execute privileged functions. Ensure proper ownership management.

2. **Module Enablement:** Enabling a module gives it significant control over the Safe. Only enable trusted modules.

3. **Threshold Management:** When using SignerManagerModule to change signers or threshold, ensure you don't lock yourself out.

4. **Transaction Validation:** BasicModule allows arbitrary transaction execution. Implement proper validation in production.

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

## Integration with WAVS

The Zodiac modules can be integrated with the WAVS (WebAssembly Verification Service) system to enable:

- Automated governance actions based on attestations
- Programmatic signer management based on on-chain events
- Integration with EAS (Ethereum Attestation Service) for trust-based operations

## Further Resources

- [Zodiac Documentation](https://github.com/gnosis/zodiac)
- [Gnosis Safe Documentation](https://docs.safe.global)
- [Safe SDK](https://github.com/safe-global/safe-sdk)
- [EAS Integration Guide](./EAS_INTEGRATION.md)
