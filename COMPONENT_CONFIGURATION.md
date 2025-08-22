# WAVS Component Configuration

This document describes how to configure WASM components for WAVS multi-component deployment.

## Overview

WAVS supports deploying multiple WASM components within a single service. Each component can have its own:

- Trigger events and contract addresses
- Submit destinations
- Package names and versions
- Execution parameters

Components are configured using a JSON file at `.docker/components-config.json`.

## Quick Start

```bash
# Initialize configuration with default components
./script/configure-components.sh init

# View configured components
./script/configure-components.sh list

# Deploy all configured components
./script/deploy-script.sh
```

## Configuration File Structure

The configuration file uses the following JSON structure:

```json
{
  "components": [
    {
      "filename": "component.wasm",
      "package_name": "wasm-package-name",
      "package_version": "1.0.0",
      "trigger_event": "EventSignature(address,uint256)",
      "trigger_json_path": "service_contracts.trigger",
      "submit_json_path": "eas_contracts.attester"
    }
  ]
}
```

### Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `filename` | Yes | WASM component filename in `compiled/` directory | `"wavs_eas_attest.wasm"` |
| `package_name` | Yes | WASI registry package name | `"wasm-eas-attest"` |
| `package_version` | Yes | Semantic version for the package | `"0.1.0"` |
| `trigger_event` | Yes | Solidity event signature to monitor | `"AttestationRequested(address,bytes32,address,bytes)"` |
| `trigger_json_path` | Yes | JSON path to trigger contract address | `"service_contracts.trigger"` |
| `submit_json_path` | Yes | JSON path to submit contract address | `"eas_contracts.attester"` |

### Contract Address Resolution

The `trigger_json_path` and `submit_json_path` fields reference addresses in `.docker/deployment_summary.json`:

```json
{
  "service_contracts": {
    "trigger": "0x1234567890123456789012345678901234567890"
  },
  "eas_contracts": {
    "attester": "0x0987654321098765432109876543210987654321"
  }
}
```

## Management Commands

### Initialize Configuration

```bash
./script/configure-components.sh init
```

Creates `.docker/components-config.json` with default EAS components.

### List Components

```bash
./script/configure-components.sh list
```

Shows all configured components with their settings.

### Add Component

Interactive mode:
```bash
./script/configure-components.sh add
```

Batch mode:
```bash
./script/configure-components.sh add-batch \
  my_component.wasm \
  wasm-my-component \
  1.0.0 \
  'MyEvent(address,uint256)' \
  service_contracts.my_trigger \
  service_contracts.my_submitter
```

### Remove Component

```bash
./script/configure-components.sh remove my_component.wasm
```

### Validate Configuration

```bash
./script/configure-components.sh validate
```

Checks JSON syntax and component structure.

### Export Configuration

```bash
./script/configure-components.sh export
```

Displays the current configuration.

## Default Components

The system includes two default components:

### EAS Attestation Component
- **File**: `wavs_eas_attest.wasm`
- **Purpose**: Processes attestation requests
- **Trigger**: `AttestationRequested(address,bytes32,address,bytes)`
- **Submit**: EAS attester contract

### EAS Compute Component  
- **File**: `wavs_eas_compute.wasm`
- **Purpose**: Performs computations on attestations
- **Trigger**: `Attested(address,address,bytes32,bytes32)`
- **Submit**: Governance voting contract

## Common JSON Paths

### Trigger Contract Paths
- `service_contracts.trigger` - Main trigger contract
- `eas_contracts.indexer_resolver` - EAS indexer resolver
- `governance_contracts.proposal_trigger` - Governance proposals

### Submit Contract Paths
- `eas_contracts.attester` - EAS attestation contract
- `governance_contracts.voting_power` - Governance voting
- `service_contracts.results` - Generic results contract

## Example Configurations

### Price Oracle Component

```json
{
  "filename": "price_oracle.wasm",
  "package_name": "wasm-price-oracle",
  "package_version": "2.1.0",
  "trigger_event": "PriceRequested(string,uint256)",
  "trigger_json_path": "service_contracts.oracle_trigger",
  "submit_json_path": "service_contracts.oracle_submit"
}
```

### Governance Executor

```json
{
  "filename": "governance_executor.wasm",
  "package_name": "wasm-governance-exec",
  "package_version": "1.0.0",
  "trigger_event": "ProposalCreated(uint256,address,string)",
  "trigger_json_path": "governance_contracts.proposal_trigger",
  "submit_json_path": "governance_contracts.execution_contract"
}
```

## Requirements

- **jq**: Required for JSON processing
- **WASM files**: All referenced components must exist in `compiled/` directory
- **Contract deployment**: Deployment summary must exist with valid contract addresses
- **Valid JSON**: Configuration file must be valid JSON syntax

## Troubleshooting

### Configuration File Not Found

```bash
❌ Component configuration file not found: .docker/components-config.json
Please run 'script/configure-components.sh init' to create the configuration.
```

**Solution**: Run `./script/configure-components.sh init`

### Invalid JSON Syntax

```bash
❌ Invalid JSON format in configuration file
```

**Solution**: Validate with `jq '.' .docker/components-config.json`

### Missing WASM File

```bash
⚠️ WASM file not found: compiled/my_component.wasm
```

**Solution**: Build the component with `make wasi-build`

### Component Validation Errors

```bash
❌ Missing package_name
```

**Solution**: Ensure all required fields are present in each component object

### Contract Address Resolution

```bash
jq: error (at .docker/deployment_summary.json:1): Cannot index string with string "trigger"
```

**Solution**: Check that contract deployment completed and addresses exist in deployment summary

## Deployment Integration

The component configuration integrates with the deployment process:

1. **Upload Phase**: Each component is uploaded to WASI registry
2. **Service Creation**: Single WAVS service is created
3. **Workflow Configuration**: Each component gets its own workflow
4. **Event Monitoring**: Each workflow monitors its specified trigger events
5. **Result Submission**: Each workflow submits to its specified contract

The deployment script automatically reads the configuration and handles all components without requiring manual intervention.