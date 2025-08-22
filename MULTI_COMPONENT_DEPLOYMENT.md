# Multi-Component WAVS Deployment

This document describes how to deploy multiple WASM components to WAVS using the enhanced deployment system.

## Overview

The WAVS deployment system now supports deploying multiple WASM components in a single service, each with their own:

- Trigger events and addresses
- Submit addresses
- Package names and versions
- Workflow configurations

Each component runs as a separate workflow within the same WAVS service.

## Quick Start

### Using Default Components

The deployment script includes two pre-configured components:

1. **wavs_eas_attest.wasm** - EAS Attestation component
2. **wavs_eas_compute.wasm** - EAS Compute component

Simply run the deployment as usual:

```bash
make setup
make build
./script/deploy-script.sh
```

### Using Managed Configuration

For better control and easier maintenance, use the component configuration manager:

```bash
# List configured components
./script/configure-components.sh list

# Run deployment (will automatically use managed config)
./script/deploy-script.sh
```

## Component Configuration Manager

The `script/configure-components.sh` helper script provides easy management of component configurations.

### Commands

#### List Components
```bash
./script/configure-components.sh list
```
Shows all configured components with their settings.

#### Add Component (Interactive)
```bash
./script/configure-components.sh add
```
Prompts for all component details interactively.

#### Add Component (Batch)
```bash
./script/configure-components.sh add-batch \
  my_component.wasm \
  wasm-my-comp \
  1.0.0 \
  'MyEvent(uint256,address)' \
  service_contracts.my_trigger \
  governance_contracts.my_submitter
```

#### Remove Component
```bash
./script/configure-components.sh remove my_component.wasm
```

#### Validate Configuration
```bash
./script/configure-components.sh validate
```
Checks all component configurations for errors.

#### Export Configuration
```bash
./script/configure-components.sh export
```
Outputs the configuration in JSON format.

## Configuration Format

Component configurations are stored in `config/components.json` with this JSON format:

### Example Configuration

```json
{
  "components": [
    {
      "filename": "wavs_eas_attest.wasm",
      "package_name": "wasm-eas-attest",
      "package_version": "0.1.0",
      "trigger_event": "AttestationRequested(address,bytes32,address,bytes)",
      "trigger_json_path": "service_contracts.trigger",
      "submit_json_path": "eas_contracts.attester"
    },
    {
      "filename": "wavs_eas_compute.wasm",
      "package_name": "wasm-eas-compute",
      "package_version": "0.1.0",
      "trigger_event": "Attested(address,address,bytes32,bytes32)",
      "trigger_json_path": "eas_contracts.indexer_resolver",
      "submit_json_path": "governance_contracts.voting_power"
    },
    {
      "filename": "my_custom_component.wasm",
      "package_name": "wasm-custom",
      "package_version": "1.2.0",
      "trigger_event": "CustomEvent(uint256)",
      "trigger_json_path": "service_contracts.custom_trigger",
      "submit_json_path": "governance_contracts.custom_submit"
    }
  ]
}
```

### Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| filename | WASM component filename | `wavs_eas_attest.wasm` |
| package_name | WASI registry package name | `wasm-eas-attest` |
| package_version | Package version | `0.1.0` |
| trigger_event | Solidity event signature | `AttestationRequested(address,bytes32,address,bytes)` |
| trigger_json_path | JSON path to trigger address | `service_contracts.trigger` |
| submit_json_path | JSON path to submit address | `eas_contracts.attester` |

### JSON Paths

### JSON Structure

The configuration uses a JSON object with a `components` array. Each component object contains the fields listed above.

### Address Resolution

The JSON paths reference fields in `.docker/deployment_summary.json`:

#### Common Trigger Paths
- `service_contracts.trigger` - Main trigger contract
- `eas_contracts.indexer_resolver` - EAS indexer resolver
- `governance_contracts.voting_trigger` - Governance trigger

#### Common Submit Paths
- `eas_contracts.attester` - EAS attester contract
- `governance_contracts.voting_power` - Governance voting contract
- `service_contracts.results` - Results submission contract

## Adding New Components

### Step 1: Build Your Component

Ensure your WASM component is built and available in `compiled/`:

```bash
# Build specific component
WASI_BUILD_DIR=components/my-component make wasi-build

# Verify it exists
ls -la compiled/my_component.wasm
```

### Step 2: Add Component Configuration

Using the interactive method:

```bash
./script/configure-components.sh add
```

Or using batch method:

```bash
./script/configure-components.sh add-batch \
  my_component.wasm \
  wasm-my-component \
  1.0.0 \
  'MyTriggerEvent(address,uint256)' \
  service_contracts.my_trigger \
  service_contracts.my_submitter
```

### Step 3: Deploy

The deployment script will automatically:

1. Upload all configured components to the WASI registry
2. Create workflows for each component
3. Configure triggers and submissions for each workflow

```bash
./script/deploy-script.sh
```

## Deployment Process

The enhanced deployment process:

1. **Component Upload**: Each configured component is uploaded to the WASI registry
2. **Service Creation**: A single WAVS service is created
3. **Workflow Creation**: Each component gets its own workflow within the service
4. **Configuration**: Each workflow is configured with its specific:
   - Trigger contract and event
   - Submit contract and destination
   - Component package reference
   - Execution parameters

## Requirements

The system requires:

- Component configuration file must exist at `config/components.json`
- All components must be built and available in the `compiled/` directory
- Valid deployment summary JSON for contract address resolution

## Troubleshooting

### Component Not Found

If deployment fails with "WASM file not found":

```bash
# Check what's in compiled/
ls -la compiled/

# Rebuild if needed
make wasi-build

# Validate JSON configuration
./script/configure-components.sh validate
```

### Registry Upload Failures

For WASI registry issues:

```bash
# Check registry connectivity
task registry

# For testnet, ensure you're logged in
warg login

# Check namespace
task get-wasi-namespace
```

### Invalid JSON Paths

If contract addresses can't be resolved:

```bash
# Check deployment summary exists
cat .docker/deployment_summary.json

# Verify path structure
jq '.service_contracts' .docker/deployment_summary.json
jq '.eas_contracts' .docker/deployment_summary.json

# Check component configuration structure
jq '.components' config/components.json
```

### Configuration Validation

Always validate before deploying:

```bash
./script/configure-components.sh validate
```

## Examples

### Oracle Component

```bash
./script/configure-components.sh add-batch \
  price_oracle.wasm \
  wasm-price-oracle \
  2.1.0 \
  'PriceRequested(string,uint256)' \
  service_contracts.oracle_trigger \
  service_contracts.oracle_submit
```

### Governance Component

```bash
./script/configure-components.sh add-batch \
  governance_executor.wasm \
  wasm-governance-exec \
  1.0.0 \
  'ProposalCreated(uint256,address,string)' \
  governance_contracts.proposal_trigger \
  governance_contracts.execution_contract
```

### Custom Attestation Component

```bash
./script/configure-components.sh add-batch \
  custom_attester.wasm \
  wasm-custom-attest \
  0.3.0 \
  'CustomAttestation(address,bytes32,bytes)' \
  eas_contracts.custom_schema \
  eas_contracts.attester
```
