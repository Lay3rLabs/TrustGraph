# [WAVS](https://docs.wavs.xyz) Symbient

TOP SECRET: a collection of fundraising, governance, and incentive mechanisms for cybernetic organisms.

<!-- **Languages**
 * [Rust (this example)](./components/evm-price-oracle/)
 * [JS / TS](./components/js-evm-price-oracle/README.md) -->

## System Requirements

<details>
<summary>Core (Docker, Compose, Make, JQ, Node v21+, Foundry)</summary>

## Ubuntu Base

- **Linux**: `sudo apt update && sudo apt install build-essential`

### Docker

If prompted, remove container with `sudo apt remove containerd.io`.

- **MacOS**: `brew install --cask docker`
- **Linux**: `sudo apt -y install docker.io`
- **Windows WSL**: [docker desktop wsl](https://docs.docker.com/desktop/wsl/#turn-on-docker-desktop-wsl-2) & `sudo chmod 666 /var/run/docker.sock`
- [Docker Documentation](https://docs.docker.com/get-started/get-docker/)

> **Note:** `sudo` is only used for Docker-related commands in this project. If you prefer not to use sudo with Docker, you can add your user to the Docker group with:
>
> ```bash
> sudo groupadd docker && sudo usermod -aG docker $USER
> ```
>
> After adding yourself to the group, log out and back in for changes to take effect.

### Docker Compose

- **MacOS**: Already installed with Docker installer
  > `sudo apt remove docker-compose-plugin` may be required if you get a `dpkg` error
- **Linux + Windows WSL**: `sudo apt-get install docker-compose-v2`
- [Compose Documentation](https://docs.docker.com/compose/)

### Make

- **MacOS**: `brew install make`
- **Linux + Windows WSL**: `sudo apt -y install make`
- [Make Documentation](https://www.gnu.org/software/make/manual/make.html)

### JQ

- **MacOS**: `brew install jq`
- **Linux + Windows WSL**: `sudo apt -y install jq`
- [JQ Documentation](https://jqlang.org/download/)

### Node.js

- **Required Version**: v21+
- [Installation via NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
nvm install --lts
```

### Foundry

```bash docci-ignore
curl -L https://foundry.paradigm.xyz | bash && $HOME/.foundry/bin/foundryup
```

</details>

<details>

<summary>Rust v1.85+</summary>

### Rust Installation

```bash docci-ignore
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

rustup toolchain install stable
rustup target add wasm32-wasip2
```

### Upgrade Rust

```bash docci-ignore
# Remove old targets if present
rustup target remove wasm32-wasi || true
rustup target remove wasm32-wasip1 || true

# Update and add required target
rustup update stable
rustup target add wasm32-wasip2
```

</details>

<details>
<summary>Cargo Components</summary>

### Install Cargo Components

On Ubuntu LTS, if you later encounter errors like:

```bash
wkg: /lib/x86_64-linux-gnu/libm.so.6: version `GLIBC_2.38' not found (required by wkg)
wkg: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.39' not found (required by wkg)
```

If GLIB is out of date. Consider updating your system using:

```bash
sudo do-release-upgrade
```

```bash docci-ignore
# Install required cargo components
# https://github.com/bytecodealliance/cargo-component#installation
cargo install cargo-binstall
cargo binstall cargo-component wasm-tools warg-cli wkg --locked --no-confirm --force

# Configure default registry
# Found at: $HOME/.config/wasm-pkg/config.toml
wkg config --default-registry wa.dev

# Allow publishing to a registry
#
# if WSL: `warg config --keyring-backend linux-keyutils`
warg key new
```

</details>

## Create Project

```bash docci-ignore
# if foundry is not installed:
# `curl -L https://foundry.paradigm.xyz | bash && $HOME/.foundry/bin/foundryup`
forge init --template Lay3rLabs/wavs-eas my-wavs-eas-app --branch main
```

> \[!TIP]
> Run `make help` to see all available commands and environment variable overrides.

### Solidity

Install the required packages to build the Solidity contracts. This project supports both [submodules](./.gitmodules) and [npm packages](./package.json).

```bash
# Install packages (npm & submodules)
make setup

# Build the contracts
forge build

# Run the solidity tests
forge test
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
make wasi-build
```

## Testing the Price Feed Component Locally

How to test the component locally for business logic validation before on-chain deployment.

TODO! Update this to actually work with our components

```bash
make wasi-exec
```

Expected output:

```shell docci-ignore

```

## WAVS

> \[!NOTE]
> If you are running on a Mac with an ARM chip, you will need to do the following:
>
> - Set up Rosetta: `softwareupdate --install-rosetta`
> - Enable Rosetta (Docker Desktop: Settings -> General -> enable "Use Rosetta for x86_64/amd64 emulation on Apple Silicon")
>
> Configure one of the following networking:
>
> - Docker Desktop: Settings -> Resources -> Network -> 'Enable Host Networking'
> - `brew install chipmk/tap/docker-mac-net-connect && sudo brew services start chipmk/tap/docker-mac-net-connect`

## Start Environment

Start an ethereum node (anvil), the WAVS service, and deploy [eigenlayer](https://www.eigenlayer.xyz/) contracts to the local network.

### Enable Telemetry (optional)

Set Log Level:

- Open the `.env` file.
- Set the `log_level` variable for wavs to debug to ensure detailed logs are captured.

> \[!NOTE]
> To see details on how to access both traces and metrics, please check out [Telemetry Documentation](telemetry/telemetry.md).

### Start the backend

```bash docci-background docci-delay-after=5
# This must remain running in your terminal. Use another terminal to run other commands.
# You can stop the services with `ctrl+c`. Some MacOS terminals require pressing it twice.
cp .env.example .env

# update the .env for either LOCAL or TESTNET

# Starts anvil + IPFS, WARG, Jaeger, and prometheus.
make start-all-local
```

## WAVS Deployment Script

This script automates the complete WAVS deployment process in a single command:

### What It Does

1. **Build Check**: Rebuilds WebAssembly component if changes detected
2. **Create Deployer**: Sets up and funds deployer account
3. **Deploy Eigenlayer**: Deploys service manager contract
4. **Deploy Contracts**: Creates trigger and submission contracts
5. **Upload Component**: Publishes WebAssembly component to WASI registry
6. **Build Service**: Creates service configuration
7. **Upload to IPFS**: Stores service metadata on IPFS
8. **Set Service URI**: Registers IPFS URI with service manager
9. **Start Aggregator**: Launches result aggregation service
10. **Start WAVS**: Launches operator service with readiness check
11. **Deploy Service**: Configures WAVS to monitor trigger events
12. **Generate Keys**: Creates operator signing keys
13. **Register Operator**: Registers with Eigenlayer AVS (0.001 ETH stake)
14. **Verify Registration**: Confirms operator registration

**Result:** A fully operational WAVS service that monitors blockchain events, executes WebAssembly components, and submits verified results on-chain.

```bash
export RPC_URL=`bash ./script/get-rpc.sh`
export AGGREGATOR_URL=http://localhost:8001

bash ./script/deploy-script.sh
```

# EAS Attestation Demo

Simple demo showing how to create a schema, trigger an attestation request, and view results.

This demo walks you through the complete attestation workflow:
1. **Register a Schema** - Define the structure for attestations (like a database table schema)
2. **Trigger an Attestation** - Request WAVS to create an attestation using your schema
3. **View Results** - Check that the attestation was successfully created on-chain

## Demo

Set these variables from deployment output:

```bash
# Parse deployment addresses from .docker/deployment_summary.json
export RPC_URL=`bash ./script/get-rpc.sh`
export SERVICE_TRIGGER_ADDR=$(jq -r '.service_contracts.trigger' .docker/deployment_summary.json)
export EAS_ADDR=$(jq -r '.eas_contracts.eas' .docker/deployment_summary.json)
export SCHEMA_REGISTRAR_ADDR=$(jq -r '.eas_contracts.schema_registrar' .docker/deployment_summary.json)
export EAS_INDEXER_ADDR=$(jq -r '.eas_contracts.indexer' .docker/deployment_summary.json)
export INDEXER_RESOLVER_ADDR=$(jq -r '.eas_contracts.indexer_resolver' .docker/deployment_summary.json)
export VOTING_POWER_ADDR=$(jq -r '.governance_contracts.voting_power' .docker/deployment_summary.json)
export REWARDS_TOKEN_ADDRESS=$(jq -r '.reward_contracts.reward_token' .docker/deployment_summary.json)
export REWARD_DISTRIBUTOR_ADDRESS=$(jq -r '.reward_contracts.reward_distributor' .docker/deployment_summary.json)
export COMPUTE_SCHEMA_UID=$(jq -r '.eas_contracts.compute_schema' .docker/deployment_summary.json)
export WALLET_ADDRESS=0x715416D37502B25F9dB8072b5a29d84Fa2b90fef
```

<!--### 1. Create and Register a Schema

Register a custom schema for skill attestations.

**What this does:** Creates a new schema in the EAS schema that defines the structure of attestations. This schema specifies that attestations will contain a message. The indexer resolver will automatically index attestations for this schema onchain (only suitable for L2s / cheaper EVM environments).

```bash
# Capture the forge output and extract schema UID automatically
forge script script/Schema.s.sol:EasSchema \
  --sig "registerSchema(string,string,string,bool)" \
  $SCHEMA_REGISTRAR_ADDR \
  "string message" \
  $INDEXER_RESOLVER_ADDR \
  true \
  --rpc-url $RPC_URL \
  --broadcast \
  --legacy 2>&1 | tee schema_output.log

# Extract schema UID using helper script
export SCHEMA_UID=$(bash script/extract-schema-uid.sh schema_output.log)
echo "Schema UID: $SCHEMA_UID"
```-->

### 2. Trigger Attestation Request

Create an attestation request using your schema.

**What this does:** Emits an `AttestationRequested` event that the WAVS operator monitors. The WAVS service will process this request, execute the WebAssembly component, and create an actual EAS attestation on-chain.

```bash
# Trigger attestation creation via WAVS
forge script script/Trigger.s.sol:EasTrigger --sig "triggerRawAttestation(string,string,string,string)" \
  "${SERVICE_TRIGGER_ADDR}" \
  $COMPUTE_SCHEMA_UID \
  $WALLET_ADDRESS \
  "Advanced Solidity Development Skills Verified" \
  --rpc-url $RPC_URL --broadcast
```

### 3. View Results

Check the attestation was created.

**What this shows:** Verifies that the WAVS operator successfully processed your request and created the attestation. You should see the attestation data stored on-chain in the EAS registry.

```bash
# Query attestations for the schema and recipient
forge script script/Trigger.s.sol:EasTrigger --sig "queryAttestations(string,string,string,string,uint256)" \
  "${EAS_INDEXER_ADDR}" \
  "${EAS_ADDR}" \
  "${COMPUTE_SCHEMA_UID}" \
  $WALLET_ADDRESS \
  10 \
  --rpc-url $RPC_URL
```

Check voting power for recipient (should have gone up by number of attestations):
```bash
forge script script/Governance.s.sol:Governance \
    --sig "queryVotingPower(string,string)" \
    $VOTING_POWER_ADDR \
    $WALLET_ADDRESS \
    --rpc-url $RPC_URL
```

### Distribute Rewards
Trigger the service to run:
```bash
forge script script/Rewards.s.sol:Rewards \
    --sig "updateRewards(string)" \
    $REWARD_DISTRIBUTOR_ADDRESS \
    --rpc-url $RPC_URL \
    --broadcast
```

Query rewards state:
```bash
forge script script/Rewards.s.sol:Rewards \
    --sig "queryContractState(string)" \
    $REWARD_DISTRIBUTOR_ADDRESS \
    --rpc-url $RPC_URL
```

Claim:
```bash
forge script script/Rewards.s.sol:Rewards \
    --sig "claimRewards(string,string)" \
    $REWARD_DISTRIBUTOR_ADDRESS \
    $REWARDS_TOKEN_ADDRESS \
    --rpc-url $RPC_URL \
    --broadcast --ffi
```

## AI Coding Agents

This template contains rulefiles for building components with Claude Code and Cursor. Read the [AI-powered component creation guide](./docs/handbook/ai.mdx) for usage instructions.

### Claude Code

To spin up a sandboxed instance of [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) in a Docker container that only has access to this project's files, run the following command:

```bash docci-ignore
npm run claude-code
# or with no restrictions (--dangerously-skip-permissions)
npm run claude-code:unrestricted
```
