# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

Use `task --list-all` to see all available commands.

### Build Commands
- `task build:forge` - Build Solidity contracts
- `task build:wasi` - Build WASI components into compiled/ directory
- `task build:wasi WASI_BUILD_DIR=components/component-name` - Build specific component

### Test Commands
- `task test` - Run all Solidity tests
- `forge test -vvv` - Run tests with verbose output (use forge directly for flags)
- `npm run test:unit` - Run unit tests matching Unit contracts
- `npm run coverage` - Generate test coverage report

### Development Environment
- `task start-all-local` - Start anvil, IPFS, WARG, Jaeger, and prometheus
- `task deploy-full` - Complete WAVS deployment pipeline
- `task setup` - Install initial dependencies (npm + forge)

### Lint and Format Commands
- `task lint:check` - Check Solidity linting and formatting
- `task lint:fix` - Fix linting and formatting issues
- `task fmt` - Format Solidity and Rust code

## Architecture Overview

TrustGraph is a WAVS (WASI AVS) project that implements attestation-based governance using EAS (Ethereum Attestation Service) and PageRank algorithms. The system uses trust attestations between accounts to calculate governance weights and distribute rewards. The system consists of:

### Core Components Structure
- **Solidity Contracts** (`src/contracts/`): On-chain logic including attestation handlers, governance, rewards, and triggers
- **WASI Components** (`components/`): Off-chain computation modules written in Rust that compile to WebAssembly
- **Deployment Scripts** (`script/`): Foundry scripts for contract deployment and service configuration
- **Frontend** (`frontend/`): Next.js application for interacting with the system

### Key Architectural Elements

#### WASI Components (`components/`)

Components that handle different aspects of the attestation and governance workflow:
- `eas-attest/`: Creates EAS attestations based on trigger events
- `merkler/`: Calculates merkle trees for TrustGraph PageRank-based governance
- `merkler-pruner/`: Prunes and maintains merkle tree data
- `aggregator/`: Aggregates operator responses
- `safe-signer-sync/`: Syncs Safe multisig signers
- `wavs-indexer/`: Indexes blockchain events for the system


#### Service Architecture
The system operates as an AVS (Actively Validated Service) where:
1. On-chain events trigger off-chain WASI components
2. Components process data and make external API calls if needed
3. Results are submitted back on-chain through aggregator services
4. Multiple operators can participate in validation and consensus

### Development Workflow Integration
- Components are built to WebAssembly and uploaded to WASI registry
- Service configurations are stored on IPFS
- Eigenlayer integration provides economic security through operator staking
- Local development uses anvil for rapid iteration

## Important Configuration

### Environment Variables
- Copy `.env.example` to `.env` before development
- `DEPLOY_ENV`: Set to LOCAL or TESTNET
- `FUNDED_KEY`: Private key with funds for contract deployment
- `WAVS_ENV_*`: Prefix for private variables accessible to WASI components

### Component Development Rules
- Always use `{ workspace = true }` in component Cargo.toml dependencies
- Never edit `bindings.rs` files - they are auto-generated
- All API response structures must derive `Clone`
- Use proper ABI decoding patterns, never `String::from_utf8` on ABI data
- Add new components to workspace members in root Cargo.toml
- Always use `#[serde(default)]` and `Option<T>` for external API response fields
- Clone data before use to avoid ownership issues: `let data_clone = data.clone();`
- Use `ok_or_else()` for Option types, `map_err()` for Result types
- Always verify API endpoints with curl before implementing code that depends on them

### Testing Patterns
- Components can be tested locally using `task wasi:exec`
- Always use string parameters for component input, even for numeric values
- Validation script at `test_utils/validate_component.sh` checks component compliance
- Always run validation and fix ALL errors before building components

### Component Creation Workflow
1. Research existing components in `/components/` for patterns
2. Create component directory: `mkdir -p components/name/src`
3. Copy template files from an existing component
4. Implement `src/lib.rs` and `src/trigger.rs` with proper ABI decoding
5. Create `Cargo.toml` using workspace dependencies
6. Add component to workspace members in root `Cargo.toml`
7. Build: `task build:wasi WASI_BUILD_DIR=components/name`
8. Test: `task wasi:exec COMPONENT_FILENAME=name.wasm INPUT_DATA="test-string"`
