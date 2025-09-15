# EAS Configuration Guide

This guide explains how Ethereum Attestation Service (EAS) addresses are automatically configured for WAVS components during deployment.

## Overview

The EAS compute component requires three configuration parameters:

- **`eas_address`**: The main EAS contract address
- **`indexer_address`**: The EAS indexer contract address
- **`chain_name`**: The blockchain network name (must match `wavs.toml` configuration)

These parameters are **automatically configured** during deployment from the contract deployment summary.

## Automatic Configuration

### During Deployment

When you run the deployment script, EAS addresses are automatically configured:

```bash
# Full deployment with automatic EAS configuration
./script/deploy-script.sh
```

The deployment process:

1. Deploys EAS contracts and saves addresses to `.docker/deployment_summary.json`
2. Extracts EAS and indexer addresses from the deployment summary
3. Determines chain name based on deployment environment (local/testnet)
4. Sets `CONFIG_VALUES` with the extracted addresses
5. Applies configuration to all components in the service manifest

### Verification

After deployment, verify the configuration in `.docker/service.json`:

```json
{
  "workflows": {
    "...": {
      "component": {
        "config": {
          "eas_address": "0x47A71270bc2dC1719F7F3C7C848c915fca95577d",
          "indexer_address": "0x71840dD52B07434f37cc2e7CcD13b67915bf036A",
          "chain_name": "local"
        }
      }
    }
  }
}
```

## How It Works

### Address Extraction

The deployment script automatically extracts addresses:

```bash
# From deploy-script.sh
EAS_ADDRESS=$(jq -r '.eas_contracts.eas' .docker/deployment_summary.json)
INDEXER_ADDRESS=$(jq -r '.wavs_indexer' .docker/deployment_summary.json)
export CONFIG_VALUES="eas_address=${EAS_ADDRESS},indexer_address=${INDEXER_ADDRESS},chain_name=${CHAIN_NAME}"
```

### Component Integration

Components automatically read configuration using WAVS's config system:

```rust
use crate::bindings::host::config_var;

// In QueryConfig::from_wavs_config()
let eas_address = config_var("eas_address")?;
let indexer_address = config_var("indexer_address")?;
let chain_name = config_var("chain_name")?;
```

### Chain Configuration

Make sure your `wavs.toml` includes the chain configuration:

```toml
[default.chains.evm.local]
chain_id = "31337"
ws_endpoint = "ws://localhost:8545"
http_endpoint = "http://localhost:8545"

[default.chains.evm.sepolia]
chain_id = "11155111"
ws_endpoint = "wss://ethereum-sepolia-rpc.publicnode.com"
http_endpoint = "https://ethereum-sepolia-rpc.publicnode.com"
```

## Manual Override (Development Only)

For development or testing, you can manually set the configuration:

```bash
# Set custom addresses before building service
export CONFIG_VALUES="eas_address=0x...,indexer_address=0x...,chain_name=local"
./script/build-service.sh
```

## Troubleshooting

### Missing Configuration

**Problem**: Components use zero addresses despite deployment.

**Check**:

1. Verify addresses exist in deployment summary:
   ```bash
   cat .docker/deployment_summary.json | jq '.eas_contracts'
   ```
2. Check generated service manifest:
   ```bash
   cat .docker/service.json | jq '.workflows[].component.config'
   ```

### Chain Configuration Missing

**Problem**: "Failed to get chain config" error.

**Solution**: Ensure chain name in configuration matches `wavs.toml`:

```bash
grep -A5 "\[.*local\]" wavs.toml
```

### Invalid Addresses

**Problem**: Address validation fails.

**Check**: Verify deployment completed successfully:

```bash
cat .docker/deployment_summary.json | jq '.eas_contracts | keys'
```

## Network Support

| Environment | Chain Name   | Configuration Source    |
| ----------- | ------------ | ----------------------- |
| Local       | `local`      | deployment_summary.json |
| Testnet     | `sepolia`    | deployment_summary.json |
| Custom      | Set manually | Manual CONFIG_VALUES    |

## Development Workflow

```bash
# 1. Deploy everything (includes automatic EAS configuration)
./script/deploy-script.sh

# 2. Verify configuration was applied
cat .docker/service.json | jq '.workflows[].component.config'

# 3. Test components
export COMPONENT_FILENAME=wavs_eas_compute.wasm
export INPUT_DATA="0x742d35cc6644c31532e12fd982fd6b8e14000000"
make wasi-exec
```

The EAS configuration is handled automatically during deployment - no manual configuration needed for normal use cases.
