# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The spec is `SPEC.md`.

## Project Overview

This is a WAVS (WebAssembly AVS) monorepo template that integrates with Ethereum Attestation Service (EAS) for building verifiable offchain applications. The project combines:

- **Solidity contracts** for blockchain interaction (EAS attestations, triggers, submissions)
- **Rust WASI components** for WebAssembly execution in the WAVS runtime
- **TypeScript/JavaScript components** for alternative WASI implementations
- **Foundry** for Solidity development and testing
- **Docker** for containerized services and deployment

## Architecture

The system follows a trigger-response pattern:
1. **Trigger contracts** emit events that WAVS monitors
2. **WASI components** process these events and perform computations
3. **Submission contracts** receive and store results from WAVS operators
4. **EAS integration** enables attestation-based workflows

Key directories:
- `src/` - Solidity contracts (triggers, submissions, EAS integration)
- `docs/` - Documentation for WAVS
- `components/` - WASI components in Rust and TypeScript
- `test/` - Foundry unit tests
- `script/` - Deployment and utility scripts

## Development Commands

### Setup
```bash
make setup                    # Install all dependencies (npm + forge)
make check-requirements      # Verify system dependencies
```

### Building
```bash
make build                   # Build all (Solidity + WASI components)
forge build                  # Build Solidity contracts only
make wasi-build             # Build WASI components only
WASI_BUILD_DIR=components/eas-attest make wasi-build  # Build specific component
```

### Multi-Component Management
```bash
script/configure-components.sh init        # Initialize component configuration
script/configure-components.sh list        # List configured components
script/configure-components.sh add         # Add component interactively
script/configure-components.sh validate    # Validate configurations
script/configure-components.sh help        # Show all available commands
```

### Testing
```bash
forge test                   # Run all Solidity tests
forge test -vvv             # Run with verbose output
npm run test:unit           # Run unit tests specifically
npm run test:integration    # Run integration tests
```

### Linting and Formatting
```bash
npm run lint:check          # Check Solidity and formatting
npm run lint:fix           # Fix linting and formatting issues
forge fmt                   # Format Solidity code
cargo fmt                   # Format Rust code
```

### WASI Component Testing
```bash
# Test a component locally (example with Bitcoin price feed)
COIN_MARKET_CAP_ID=1 make wasi-exec
```

### Local Development Environment
```bash
make start-all-local        # Start anvil, IPFS, WARG, telemetry services
# This creates .env from .env.example if it doesn't exist
```

## Component Development

### Rust WASI Components
Located in `components/*/src/lib.rs`. Components must:
- Implement the `Guest` trait from bindings
- Handle `TriggerAction` input and return `WasmResponse`
- Use the trigger module for encoding/decoding blockchain data
- Support both Ethereum (ABI-encoded) and CLI output destinations

### TypeScript WASI Components
Located in `components/*/index.ts`. Similar patterns to Rust but using:
- JavaScript/TypeScript instead of Rust
- Same trigger/response pattern
- Fetch API for HTTP requests

## Contract Development

### Key Contracts
- `WavsTrigger.sol` - Emits events for WAVS to monitor
- `WavsSubmit.sol` - Receives and stores computation results
- EAS integration contracts in `src/contracts/` for attestations

### Testing
- Unit tests in `test/unit/`
- Use Foundry's testing framework
- Mock external dependencies where appropriate

## Multi-Component Deployment

The system supports deploying multiple WASM components as separate workflows within a single WAVS service. Each component can have its own trigger events, submit addresses, and configurations.

**📖 See [Component Configuration Guide](docs/COMPONENT_CONFIGURATION.md) for detailed documentation.**

### Quick Setup

```bash
# Initialize component configuration
script/configure-components.sh init

# View configured components  
script/configure-components.sh list

# Deploy all components
script/deploy-script.sh
```

### Default Components
- **wavs_eas_attest.wasm** - EAS attestation processing
- **wavs_eas_compute.wasm** - EAS computation workflows

Components are configured in `.docker/components-config.json` using JSON format.

## Deployment

The deployment process involves multiple steps coordinated through shell scripts:
1. Deploy EigenLayer contracts (`make wavs-middleware`)
2. Deploy service contracts (`script/deploy-contracts.sh`)
3. **Configure components** (`script/configure-components.sh init`) - **Required**
4. Build and upload multiple WASI components (`script/upload-to-wasi-registry.sh`)
5. Create service with multiple component workflows (`script/build-service.sh`)
6. Configure aggregator and WAVS operator instances

**Note**: Component configuration is required - deployment will fail without `.docker/components-config.json`

## Environment Variables

Key variables (see `.env.example`):
- `RPC_URL` - Ethereum RPC endpoint
- `WAVS_ENDPOINT` - WAVS service endpoint
- Various contract addresses set during deployment

## Tooling

- **Foundry** - Solidity development (forge, cast, anvil)
- **Cargo** - Rust toolchain for WASI components
- **Docker** - Container orchestration
- **Make** - Build automation and task running
- **Node.js v21+** - JavaScript runtime and npm packages
