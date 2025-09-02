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

```bash
task deploy:full && task deploy:single-operator-poa
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

## LLM Attester

Make a statement attestation to be reviewed by the `llm-attester` component:
```bash
task forge:trigger-statement-attestation INPUT="Advanced Solidity Development Skills Verified"
```

Query latest attestations from AI:
```bash
task forge:query-statement-attestations
```

## WAVS Safe Zodiac Module (DAO Agent)

Trigger the DAO agent with some input:
```bash
task forge:agent-trigger INPUT="To save the rainforest, send 1 ETH to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3"
```

Wait a bit for the component to run.

Verify funds were sent:
```bash
cast balance 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3 --rpc-url http://localhost:8545
```

## Prediction Market Demo

### Option 1: Complete Demo Flow

Run all steps automatically:

```bash
task prediction-market:full-demo
```

This will:
1. Check initial balances
2. Buy YES outcome tokens
3. Trigger the oracle AVS to resolve the market
4. Redeem outcome tokens for collateral
5. Check final balances

### Option 2: Step-by-Step Execution

#### Step 1: Check Initial Balances

```bash
task prediction-market:query-balances
```

This shows your current collateral and conditional token balances.

#### Step 2: Buy Outcome Tokens

Buy YES tokens (betting Bitcoin price is over $1):
```bash
task prediction-market:buy-yes
```

Or buy NO tokens (betting Bitcoin price is not over $1):
```bash
task prediction-market:buy-no
```

> **Note**: You start with 1e18 collateral tokens. When buying YES shares, you'll purchase 1e18 YES shares for approximately 5.25e17 collateral tokens, leaving approximately 4.75e17 collateral tokens remaining.

#### Step 3: Query Market State (Optional)

Check the current market state:
```bash
task prediction-market:query-market
```

#### Step 4: Trigger Oracle Resolution

Run the AVS service to resolve the market:
```bash
task prediction-market:trigger-oracle
```

This triggers the oracle AVS which will:
- Fetch the current Bitcoin price
- Determine if it's over $1 (it will be!)
- Resolve the market accordingly

The task automatically waits 3 seconds for the component to execute.

#### Step 5: Redeem Outcome Tokens

Redeem your winning outcome tokens for collateral:
```bash
task prediction-market:redeem-tokens
```

#### Step 6: Check Final Balances

Verify your tokens were successfully redeemed:
```bash
task prediction-market:query-balances
```

## Geyser (Factory Pattern) - optional

```bash
(cd components/geyser && make wasi-build)
# manually test geyser
export ipfs_cid=$(SERVICE_FILE=.docker/service.json make upload-to-ipfs)

# escaped like the contract was / is
COMPONENT_WORKFLOW='{\"trigger\":{\"evm_contract_event\":{\"address\":\"0x227db69d4b5e53357c71eea4475437f82ca605c3\",\"chain_name\":\"local\",\"event_hash\":\"0x3458a6422cada5bac0a323427c37ac55fede4fae5bd976fde40536903086999e\"}},\"component\":{\"source\":{\"Registry\":{\"registry\":{\"digest\":\"daa622d209437fefac4bdfbf1f21ba036e9af22b1864156663b6aa372942f13c\",\"domain\":\"localhost:8090\",\"version\":\"0.1.0\",\"package\":\"example:geyser\"}}},\"permissions\":{\"allowed_http_hosts\":\"all\",\"file_system\":true},\"fuel_limit\":1000000000000,\"time_limit_seconds\":30,\"config\":{\"chain_name\":\"local\"},\"env_keys\":[\"WAVS_ENV_SOME_SECRET\"]},\"submit\":{\"aggregator\":{\"url\":\"http:\/\/localhost:8001\",\"component\":null,\"evm_contracts\":[{\"chain_name\":\"local\",\"address\":\"0x227db69d4b5e53357c71eea4475437f82ca605c3\",\"max_gas\":5000000}],\"cosmos_contracts\":null}}}'

make wasi-exec COMPONENT_FILENAME=geyser.wasm INPUT_DATA="${ipfs_cid}___${COMPONENT_WORKFLOW}"
```

```bash
# execute againt the WAVS trigger for the deployment summary
GYSER_ADDR=`jq -rc .geyser.trigger .docker/deployment_summary.json`
WAVS_SERVICE_MANAGER_ADDRESS=`task config:service-manager-address`

# just for debugging
IPFS_URL=$(cast call --rpc-url http://localhost:8545 $WAVS_SERVICE_MANAGER_ADDRESS "getServiceURI()(string)" | tr -d '"' | tr -d '\')
echo "IPFS URL: ${IPFS_URL}"
cid=$(echo $IPFS_URL | cut -d'/' -f3)
curl http://127.0.0.1:8080/ipfs/${cid} | jq -rc '.'

# take the current owner (funded key) and transfer the ownership to the geyser handler. This way the handler can call the updateServiceUri method
export FUNDED_KEY=`task config:funded-key`
# change owner of the service manager -> the GYSER_ADDR, from funded key
cast send ${WAVS_SERVICE_MANAGER_ADDRESS} 'transferOwnership(address)' "${GYSER_ADDR}" --rpc-url http://localhost:8545 --private-key $FUNDED_KEY

COMPONENT_WORKFLOW='{"trigger":{"evm_contract_event":{"address":"0x227db69d4b5e53357c71eea4475437f82ca605c3","chain_name":"local","event_hash":"0x3458a6422cada5bac0a323427c37ac55fede4fae5bd976fde40536903086999e"}},"component":{"source":{"Registry":{"registry":{"digest":"daa622d209437fefac4bdfbf1f21ba036e9af22b1864156663b6aa372942f13c","domain":"localhost:8090","version":"0.1.0","package":"example:geyser"}}},"permissions":{"allowed_http_hosts":"all","file_system":true},"fuel_limit":1000000000000,"time_limit_seconds":30,"config":{"chain_name":"local"},"env_keys":["WAVS_ENV_SOME_SECRET"]},"submit":{"aggregator":{"url":"http://localhost:8001","component":null,"evm_contracts":[{"chain_name":"local","address":"0x227db69d4b5e53357c71eea4475437f82ca605c3","max_gas":5000000}],"cosmos_contracts":null}}}'

cast send --rpc-url http://localhost:8545 --private-key $FUNDED_KEY $GYSER_ADDR "updateExample(string)" "${COMPONENT_WORKFLOW}"

docker logs wavs-1 # 'assertion `left == right` failed' error is okay.
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
