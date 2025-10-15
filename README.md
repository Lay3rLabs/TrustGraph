# [WAVS](https://docs.wavs.xyz) Gov

Some next-gen attestation-based governance tools. Get setup with the [Setup Readme](./README_SETUP.md)

**Status:** HIGHLY EXPERIMENTAL! Please experiment with us.

### Solidity

Install the required packages to build the Solidity contracts.

```bash
# Install packages (npm & submodules)
task setup

# Build the contracts (`forge build` also works)
task build:forge

# Run the solidity tests
task test
```

## Build WASI components

Now build the WASI components into the `compiled` output directory.

> \[!WARNING]
> If you get: `error: no registry configured for namespace "wavs"`
>
> run, `wkg config --default-registry wa.dev`

> \[!WARNING]
> If you get: `failed to find the 'wasm32-wasip1' target and 'rustup' is not available`
>
> `brew uninstall rust` & install it from <https://rustup.rs>

```bash
task build:wasi
```

## WAVS

## Start Environment

Start an ethereum node (anvil), the WAVS service, and deploy AVS contracts to the local network.

### Start the backend

```bash docci-background docci-delay-after=5
# This must remain running in your terminal. Use another terminal to run other commands.
# You can stop the services with `ctrl+c`. Some MacOS terminals require pressing it twice.
cp .env.example .env

# update the .env for either LOCAL or TESTNET

# Starts anvil + IPFS, WARG, Jaeger, and prometheus.
task start-all-local
```

## WAVS Deployment Script

This script automates the complete WAVS deployment process in a single command:

```bash
# export SKIP_COMPONENT_UPLOAD=true && export SKIP_CONTRACT_UPLOAD=true
task deploy:full && task deploy:single-operator-poa-local
```

# EAS Attestation Demo

Simple demo showing how to create a schema, trigger an attestation request, and view results.

This demo walks you through the complete attestation workflow:

1. **Register a Schema** - Define the structure for attestations (like a database table schema)
2. **Trigger an Attestation** - Request WAVS to create an attestation using your schema
3. **View Results** - Check that the attestation was successfully created on-chain

## Demo

### PageRank Testing

Create a comprehensive PageRank test network with real attestations:

```bash
# Create 40+ real attestations across different network patterns
# Set TEST_ADDRESS to your wallet address from config
TEST_ADDRESS=$(task config:wallet-address) task trustgraph:full-setup
```

This creates a realistic attestation network with:

- **Alice** (Central Hub) - 11 incoming connections
- **Diana** (Authority) - 565 total vouching weight
- **Charlie** (Bridge) - 7+ cross-group connections
- Multiple patterns: chains, clusters, mutual relationships

Perfect for testing PageRank-based reward algorithms!

### Distribute Rewards

Trigger the service to run:

```bash
task forge:update-rewards
```

Query rewards state:

```bash
task forge:query-rewards
```

Claim:

```bash
task forge:claim-rewards

task forge:query-rewards-balance
```
