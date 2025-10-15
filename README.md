# TrustGraph

Some next-gen attestation-based governance tools.

**Status:** HIGHLY EXPERIMENTAL! Please experiment with us.

Built with [WAVS](https://wavs.xyz).

## Usage

### 1. System setup

Follow the instructions in [README_SETUP.md](./README_SETUP.md) to ensure your system is setup with the necessary tools and dependencies.

Then install dependencies:

```bash
# Install packages (nodejs & submodules)
task -y setup
```

### 2. Solidity

This project utilizes both [submodules](./.gitmodules) and [node packages](./package.json) for Solidity dependencies.

```bash
# Build the contracts (`forge build` also works)
task build:forge

# Run the solidity tests
task test
```

### 3. Build WASI components

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
task -y build:wasi
```

### 4. Start backend services

> [!NOTE]
> This must remain running in your terminal. Use new terminals to run other commands. You can stop the services with `ctrl+c`. Some terminals require pressing it twice.

```bash docci-background docci-delay-after=5
# Create a .env file from the example
cp .env.example .env

# Start Anvil, IPFS, and WARG registry.
task -y start-all-local
```

### 5. Deploy and run WAVS

This script automates the complete WAVS deployment process, including contract deployments and component uploads, in a single command:

```bash
task -y deploy:full && task deploy:single-operator-poa-local
```

Optionally skip the component upload and/or contract deployment if already done or redeploying:

```bash docci-ignore
export SKIP_COMPONENT_UPLOAD=true
export SKIP_CONTRACT_UPLOAD=true
```

### 6. Start frontend

**In a new terminal**, start the frontend:

```bash
pnpm frontend dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Start indexer

**In another new terminal**, start the [Ponder.sh](https://ponder.sh) indexer:

```bash
pnpm indexer dev
```

### 8. Deploy Test Network of Attestations

Create a comprehensive test network with real attestations:

```bash
# Create 40+ real attestations across different network patterns
# Set TEST_ADDRESS to your wallet address (or use the one from the config)
TEST_ADDRESS=$(task config:wallet-address) task trustgraph:full-setup
```

This creates a realistic attestation network with:

- **Alice** (Central Hub) - 11 incoming connections
- **Diana** (Authority) - 565 total vouching weight
- **Charlie** (Bridge) - 7+ cross-group connections
- Multiple patterns: chains, clusters, mutual relationships

Perfect for testing PageRank-based reward algorithms!

### 9. Explore other functionality

```bash
task forge:query-attestations

task forge:update-rewards

task forge:query-rewards

task forge:claim-rewards

task forge:query-rewards-balance
```
