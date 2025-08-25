# [WAVS](https://docs.wavs.xyz) Symbient

TOP SECRET: a collection of fundraising, governance, and incentive mechanisms for cybernetic organisms.

<!-- **Languages**
 * [Rust (this example)](./components/evm-price-oracle/)
 * [JS / TS](./components/js-evm-price-oracle/README.md) -->

## System Requirements

<details>
<summary>Core (Docker, Compose, Task, JQ, Node v21+, Foundry)</summary>

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

### Task (Taskfile)

- **MacOS**: `brew install go-task`
- **Linux + Windows WSL**: `npm install -g @go-task/cli`
- [Task Documentation](https://taskfile.dev/)

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
> Run `task --list-all` to see all available commands and environment variable overrides.

### Solidity

Install the required packages to build the Solidity contracts. This project supports both [submodules](./.gitmodules) and [npm packages](./package.json).

```bash
# Install packages (npm & submodules)
task setup

# Build the contracts
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

## Testing the Price Feed Component Locally

How to test the component locally for business logic validation before on-chain deployment.

TODO! Update this to actually work with our components

```bash
# task wasi:exec COMPONENT_FILENAME=component.wasm INPUT_DATA="test-string"
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
task start-all-local
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
task deploy:full

export WAVS_SERVICE_MANAGER_ADDRESS=$(jq -r '.contract' .docker/poa_sm_deploy.json)
PRIVATE_KEY=`task config:funded-key` OPERATOR_NUM=1 OPERATOR_WEIGHT=10 task operator:whitelist

OPERATOR_NUM=1 task operator:register
OPERATOR_NUM=1 task operator:verify
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
TEST_ADDRESS=$(task config:wallet-address) task pagerank:full-setup

# Verify the network and get PageRank recommendations
# task eas:verify-pagerank-network
```

This creates a realistic attestation network with:
- **Alice** (Central Hub) - 11 incoming connections
- **Diana** (Authority) - 565 total vouching weight
- **Charlie** (Bridge) - 7+ cross-group connections
- Multiple patterns: chains, clusters, mutual relationships

Perfect for testing PageRank-based reward algorithms!

### 1. Trigger Attestation Request

Create an attestation request using your schema.

**What this does:** Emits an `AttestationRequested` event that the WAVS operator monitors. The WAVS service will process this request, execute the WebAssembly component, and create an actual EAS attestation on-chain.

```bash
# Trigger attestation creation via WAVS
task forge:trigger-attestation INPUT="Advanced Solidity Development Skills Verified"
```

### 2. View Results

Check the attestation was created.

**What this shows:** Verifies that the WAVS operator successfully processed your request and created the attestation. You should see the attestation data stored on-chain in the EAS registry.

```bash
# Query attestations for the schema and recipient
task forge:query-attestations
```

Check voting power for recipient, it should have gone up by number of attestations (note this is a separate demo from MerkleGov which we'll show later):
```bash
task forge:query-voting-power
```

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

## Geyser (Factory Pattern) - optional

```bash
# execute againt the WAVS trigger for the deployment summary
GYSER_ADDR=`jq -rc .geyser.trigger .docker/deployment_summary.json`

# just for debugging
IPFS_URL=$(cast call --rpc-url http://localhost:8545 $WAVS_SERVICE_MANAGER_ADDRESS "getServiceURI()(string)" | tr -d '"' | tr -d '\')
echo "IPFS URL: ${IPFS_URL}"
cid=$(echo $IPFS_URL | cut -d'/' -f3)
UPDATED_CONTENT=$(curl http://127.0.0.1:8080/ipfs/${cid} | jq -rc '.workflows = {}')

echo "$UPDATED_CONTENT" > .docker/service_tmp.json
IPFS_CID=$(SERVICE_FILE=.docker/service_tmp.json make upload-to-ipfs)

curl http://127.0.0.1:8080/ipfs/${IPFS_CID}

# take the current owner (funded key) and transfer the ownership to the geyser handler. This way the handler can call the updateServiceUri method
export FUNDED_KEY=`task config:funded-key`
# change owner of the service manager -> the GYSER_ADDR, from funded key
cast send ${WAVS_SERVICE_MANAGER_ADDRESS} 'transferOwnership(address)' "${GYSER_ADDR}" --rpc-url http://localhost:8545 --private-key $FUNDED_KEY


# TODO: this should be a JSON blob of the component workflow stuff
# TODO: this way we only have to append the new unique id, and not worry that they modified other things
# For now I am just using IPFS to simulate the update rather than anything else
cast send --rpc-url http://localhost:8545 --private-key $FUNDED_KEY $GYSER_ADDR "updateExample(string)" "ipfs://${IPFS_CID}"

cast call --rpc-url http://localhost:8545 $WAVS_SERVICE_MANAGER_ADDRESS "getServiceURI()(string)"
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
