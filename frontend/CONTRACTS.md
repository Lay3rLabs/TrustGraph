# Contract Configuration

This directory contains the wagmi configuration and contract setup for the EN0VA frontend application.

## Architecture

### Files

- **`lib/wagmi.ts`** - Wagmi configuration with chain setup and connectors
- **`lib/contracts.ts`** - Contract addresses, schemas, and ABIs
- **`scripts/update-contracts.js`** - Script to update addresses from forge deployments

### Contract ABIs

Contract ABIs are maintained directly in `contracts.ts` and kept in sync with the Forge build output. This ensures:
- Type safety with proper TypeScript definitions
- Centralized contract configuration
- Easy maintenance and updates

## Usage

### Importing Contracts

```typescript
import { CONTRACTS, SCHEMAS, ATTESTER_ABI } from "@/lib/contracts"

// Use contract addresses
const attesterAddress = CONTRACTS.ATTESTER

// Use schema UIDs  
const basicSchema = SCHEMAS.BASIC_SCHEMA

// Use ABIs
const attesterABI = ATTESTER_ABI
```

### Using with Wagmi

```typescript
import { useWriteContract } from "wagmi"
import { CONTRACTS, ATTESTER_ABI } from "@/lib/contracts"

function MyComponent() {
  const { writeContract } = useWriteContract()
  
  const createAttestation = () => {
    writeContract({
      address: CONTRACTS.ATTESTER,
      abi: ATTESTER_ABI,
      functionName: "attest",
      args: [schema, recipient, data],
    })
  }
}
```

## Development Workflow

### 1. Contract Changes

When contracts are updated and redeployed:

1. **Rebuild contracts** (from root directory):
   ```bash
   forge build
   ```

2. **Update addresses** from deployment:
   ```bash
   npm run contracts:update
   ```

3. **Rebuild frontend** to pick up changes:
   ```bash
   npm run build
   ```

### 2. Adding New Contracts

To add a new contract:

1. Add the contract address to `CONTRACTS` in `contracts.ts`
2. Add the ABI as a new exported constant (like `NEW_CONTRACT_ABI`)
3. Update the type definitions as needed

### 3. Schema Management

Schema UIDs are stored in `SCHEMAS`. When new schemas are deployed:

1. Add the new schema UID to the `SCHEMAS` object
2. Update any schema-specific UI components

## Chain Configuration

The application supports:
- **Local Anvil** (Chain ID: 17000) - Primary development
- **Sepolia** (Chain ID: 11155111) - Testnet
- **Ethereum Mainnet** (Chain ID: 1) - Production

### Network Switching

The UI automatically detects the current network and provides switching capabilities:
- Shows current network in the connection status
- "ADD LOCAL" button to add Anvil network to MetaMask
- "SWITCH TO LOCAL" button to switch to local development

## Type Safety

This setup provides full TypeScript type safety:
- Contract addresses are strongly typed
- ABIs include full type information
- Schema UIDs are type-safe constants

## Scripts

- **`npm run contracts:update`** - Update contract addresses from latest deployment
- **`npm run build`** - Build and type-check the application

## Troubleshooting

### Build Issues

If you see import errors:
1. Check that all exports are properly defined in `contracts.ts`
2. Verify that TypeScript compilation is successful
3. Ensure all contract addresses and ABIs are properly formatted

### Network Issues

If MetaMask doesn't recognize the local network:
1. Use the "ADD LOCAL" button in the UI
2. Or manually add network with Chain ID 17000 and RPC http://localhost:8545

### Contract Call Failures

1. Check that you're connected to the correct network (Chain ID 17000 for local)
2. Verify contract addresses match the latest deployment
3. Check the browser console for detailed error logs