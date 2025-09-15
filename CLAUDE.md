# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build Commands
- `make build` - Build both Solidity contracts and WASI components
- `forge build` - Build only Solidity contracts
- `make wasi-build` - Build WASI components into compiled/ directory
- `WASI_BUILD_DIR=components/component-name make wasi-build` - Build specific component

### Test Commands
- `forge test` - Run all Solidity tests
- `forge test -vvv` - Run tests with verbose output
- `npm run test:unit` - Run unit tests matching Unit contracts
- `npm run coverage` - Generate test coverage report

### Development Environment
- `make start-all-local` - Start anvil, IPFS, WARG, Jaeger, and prometheus
- `bash ./script/deploy-script.sh` - Complete WAVS deployment pipeline
- `make setup` - Install initial dependencies (npm + forge)

### Component Development
- `make validate-component COMPONENT=component-name` - Validate component against best practices
- `make wasi-exec COMPONENT_FILENAME=component.wasm INPUT_DATA="test-string"` - Execute component locally
- Component files are generated with: `mkdir -p components/name/src && cp components/evm-price-oracle/src/bindings.rs components/name/src/ && cp components/evm-price-oracle/config.json components/name/ && cp components/evm-price-oracle/Makefile components/name/`

### Lint and Format Commands
- `npm run lint:check` - Check Solidity linting and formatting
- `npm run lint:fix` - Fix linting and formatting issues
- `forge fmt` - Format Solidity code
- `cargo fmt` - Format Rust code

## Architecture Overview

This is a WAVS (WASI AVS) project that provides Ethereum Attestation Service (EAS) integration with off-chain computation capabilities. The system consists of:

### Core Components Structure
- **Solidity Contracts** (`src/contracts/`): On-chain logic including attestation handlers, governance, rewards, and triggers
- **WASI Components** (`components/`): Off-chain computation modules written in Rust that compile to WebAssembly
- **Deployment Scripts** (`script/`): Foundry scripts for contract deployment and service configuration
- **Frontend** (`frontend/`): Next.js application for interacting with the system

### Key Architectural Elements

#### WASI Components (`components/`)

Three main components that handle different aspects of the attestation workflow:
- `eas-attest/`: Creates EAS attestations based on trigger events
- `eas-compute/`: Computes voting power and updates based on attestation data
- `merkler/`: Calculates a merkle tree based on attestation activity

#### Smart Contracts (`src/contracts/`)
- `WavsAttester.sol`: Main attestation request handler
- `VotingPower.sol`: Manages voting power based on attestations
- `RewardDistributor.sol`: Handles reward distribution logic
- `EASAttestTrigger.sol`: Event emission for off-chain component triggers
- `Governor.sol`: Governance implementation using attestation-based voting

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
- Components can be tested locally using `make wasi-exec`
- Always use string parameters for component input, even for numeric values
- Validation script at `test_utils/validate_component.sh` checks component compliance
- Use `make validate-component COMPONENT=component-name` to validate components
- Always run validation and fix ALL errors before building components

### Component Creation Workflow
1. Research existing components in `/components/` for patterns
2. Create component directory: `mkdir -p components/name/src`
3. Copy template files: `cp components/evm-price-oracle/src/bindings.rs components/name/src/ && cp components/evm-price-oracle/config.json components/name/ && cp components/evm-price-oracle/Makefile components/name/`
4. Implement `src/lib.rs` and `src/trigger.rs` with proper ABI decoding
5. Create `Cargo.toml` using workspace dependencies
6. Add component to workspace members in root `Cargo.toml`
7. Validate: `make validate-component COMPONENT=name`
8. Build: `WASI_BUILD_DIR=components/name make wasi-build`
9. Test: `make wasi-exec COMPONENT_FILENAME=name.wasm INPUT_DATA="test-string"`