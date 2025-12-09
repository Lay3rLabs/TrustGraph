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

---

# Symbient DEMO

> "A [§ymbient](https://symbient.life) is a distinct entity emerging from the symbiosis between organic beings and synthetic systems."

This demo is comprised of two WAVS components working together with their human communities:
- **Moderator:** reviews proposals to make sure they abide by DAO policies. Proposals must be approved before being passed to the Actor.
- **Actor:** executes actions on a smart account, only runs on proposals reviewed by the moderator.

Both components are customizable with extensive config options controlled by a TrustGraph.

## The Flow

1. User makes proposal in plain text and submits payment to pay for off-chain execution. The proposal takes the form of an attestation, which emits an event.
2. The Attestation Event causes the moderator component to run, it evaluates the proposal based on a policy (its config + system prompt), enforcing that proposals must abide by community rules (whatever those might be). It makes an attestation about the proposal which also emits another event trigger.
3. The Event Trigger causes the actor component to run (assuming the proposal is approved). The actor is given a context (config + system prompt + context + tools) and does inference on the proposal. It may decide to perform a blockchain transaction via it's smart account. 

```
          ┌──────────────────────────────────┐
          │      STEP 1: User Submission     │
          └──────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │         USER          │
              │  • Creates proposal   │
              │  • Submits payment    │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  ATTESTATION CREATED  │
              │      (on-chain)       │
              └───────────────────────┘
                          │
                          │ emits event
                          ▼
          ┌──────────────────────────────────┐
          │      STEP 2: Moderation          │
          └──────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  MODERATOR COMPONENT  │
              │  • Reads proposal     │
              │  • Checks policy      │
              │  • Enforces rules     │
              └───────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ MODERATION RESULT     │
              └───────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
      ┌──────────┐                ┌──────────┐
      │ APPROVED │                │ REJECTED │
      └──────────┘                └──────────┘
            │                           │
            │                           ▼
            │                       [ STOP ]
            │
            │ emits event
            ▼
          ┌──────────────────────────────────┐
          │      STEP 3: Execution           │
          └──────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   ACTOR COMPONENT     │
              │  • Receives proposal  │
              │  • Performs inference │
              │  • Has tools access   │
              └───────────────────────┘
                          │
                          │ decides
                          ▼
              ┌───────────────────────┐
              │   SMART ACCOUNT TX    │
              │  (optional action)    │
              └───────────────────────┘
                          │
                          ▼
                   [ ON-CHAIN ]
```

## tl;dr how it works

Multiple independent operators deterministically execute the same inference request, sign their results, and reach consensus—ensuring correctness without trusting any single party. You can think of this as an AI oracle.

```


┌──────────────┐     ┌─────────────────────────────────────┐     ┌──────────────┐
│              │     │         Operator Quorum             │     │              │
│   Trigger    │────▶│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  │────▶│  Consensus   │
│   (on-chain) │     │  │ A │  │ B │  │ C │  │ D │  │ E │  │     │   Result     │
│              │     │  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  └─┬─┘  │     │  (on-chain)  │
└──────────────┘     │    │      │      │      │      │    │     └──────────────┘
                     │    ▼      ▼      ▼      ▼      ▼    │
                     │  [sig]  [sig]  [sig]  [sig]  [sig]  │
                     │         Signature Aggregation       │
                     └─────────────────────────────────────┘


```

1. **Trigger**: An on-chain event creates an inference request
2. **Execute**: All operators in the quorum independently run the inference
3. **Sign**: Each operator signs their result
4. **Aggregate**: Signatures are collected and verified
5. **Submit**: Consensus result is posted on-chain

Operators can be selected via a number of means, and may be required to put up bonds to ensure good behavior.

[Learn more about WAVS.](https://wavs.xyz)

## Running the demo
Optional, in a separate terminal to view WAVS logs:
```bash
docker logs wavs-1 -f | grep -v "INFO"
```

Submit a proposal (automatically submits payment):
```bash
task eas:trigger \
  EAS_ADDRESS="$(task config:eas-addr)" \
  SCHEMA_UID="$(task config:proposal-schema-id)" \
  RECIPIENT="$(task config:wallet-address)" \
  MESSAGE="We need to do truely great things. The latest GitCoin Bioregionalism grants round is helping to plant lots of trees. We propose to send 1 ETH to 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3"
```

Query the balance (should now be 1 ETH):
```bash
cast balance 0xDf3679681B87fAE75CE185e4f01d98b64Ddb64a3 --rpc-url http://localhost:8545
```

Experiment with changing proposal message.
