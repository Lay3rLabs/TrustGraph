# Zodiac + Safe Setup

This document describes the Zodiac module setup created for experimental governance mechanisms with Safe fallback.

## Components Created

### 1. Zodiac Modules

#### BasicZodiacModule (`src/contracts/modules/BasicZodiacModule.sol`)
- Extends the base Zodiac Module with Ownable functionality  
- Provides basic transaction execution through the module
- Configurable avatar and target addresses
- Owner-only access control

**Key Features:**
- `executeTransaction()` - Execute transactions through the module
- `executeTransactionReturnData()` - Execute and return transaction data
- `setUp()` - Configure module with avatar and target

#### SignerManagerModule (`src/contracts/modules/SignerManagerModule.sol`)
- Specialized module for managing Safe signers and threshold
- Provides programmatic signer management capabilities
- Includes view functions to inspect current Safe state

**Key Features:**
- `addSigner()` - Add new signer with threshold update
- `removeSigner()` - Remove existing signer with threshold update  
- `swapSigner()` - Replace one signer with another
- `changeThreshold()` - Update the required signature threshold
- `getSigners()` - View current Safe owners
- `getThreshold()` - View current threshold

### 2. Deployment Script

#### DeployZodiacSafes (`script/DeployZodiacSafes.s.sol`)
- Follows project conventions (extends Common.s.sol)
- Deploys Safe singleton and factory
- Creates two Safe proxies with different initial configurations
- Deploys both types of modules for each Safe
- Outputs deployment addresses to JSON file

**Deployment Configuration:**
- **Safe 1**: 3 signers, threshold 2, both modules
- **Safe 2**: 2 signers, threshold 2, both modules
- **Output**: `.docker/zodiac_safes_deploy.json`

### 3. Test Suite

#### ZodiacModulesTest (`test/unit/ZodiacModules.t.sol`)
- Comprehensive test coverage for both modules
- Tests Safe deployment and initial setup
- Verifies module configuration and ownership
- Tests view functions for current state inspection
- Includes access control tests

**Test Coverage:**
- Module setup and configuration
- Safe initial state verification  
- Signer inspection functions
- Access control (only owner functions)
- Event emission verification

## Usage Instructions

### Building and Testing

```bash
# Build the contracts
forge build

# Run the unit tests
forge test

# Run tests with verbose output
forge test -vvv

# Run only the Zodiac module tests
forge test --match-contract ZodiacModulesTest
```

### Deploying

```bash
# Deploy the Zodiac Safes setup
forge script script/DeployZodiacSafes.s.sol --broadcast --rpc-url $RPC_URL
```

### Module Integration

To integrate these modules with Safes in practice:

1. **Deploy the contracts** using the deploy script
2. **Enable modules on Safes** through Safe transactions:
   ```solidity
   safe.execTransaction(
       address(safe),
       0,
       abi.encodeWithSignature("enableModule(address)", moduleAddress),
       Operation.Call,
       // ... signatures
   );
   ```
3. **Use modules for governance** through the owner-controlled functions

## Architecture Notes

### Safe + Zodiac Integration
- Safes act as the ultimate execution layer (Avatar)
- Modules provide programmatic control interfaces
- Owner of modules controls governance decisions
- Safe owners provide fallback control mechanism

### Security Considerations
- Modules must be explicitly enabled on Safes
- Module owners have significant control over Safe operations
- Safe owners can disable modules as fallback mechanism
- Consider timelock mechanisms for production use

### Extension Points

The current setup provides a foundation for:
- **Attestation-based governance** - Use EAS attestations to control signer changes
- **Voting mechanisms** - Integrate with voting contracts for democratic control
- **Automated signer rotation** - Based on various triggers or conditions
- **Multi-Safe coordination** - Cross-Safe governance mechanisms

## Next Steps

1. **Enable modules on Safes** through proper Safe transactions
2. **Add timelock mechanisms** for enhanced security
3. **Integrate with attestation system** for governance triggers
4. **Add governance voting** for module decision making
5. **Test on testnet** with real Safe transactions

## Files Modified/Created

- `remappings.txt` - Added Zodiac and Safe contract mappings
- `src/contracts/modules/BasicZodiacModule.sol` - Basic module implementation
- `src/contracts/modules/SignerManagerModule.sol` - Signer management module  
- `script/DeployZodiacSafes.s.sol` - Deployment script
- `test/unit/ZodiacModules.t.sol` - Test suite
- `ZODIAC_SETUP.md` - This documentation