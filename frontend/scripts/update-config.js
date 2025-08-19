#!/usr/bin/env node
/**
 * Script to update wagmi.config.ts and schemas.ts with latest deployment data
 */

const fs = require("fs");
const path = require("path");

// Path to deployment summary and config files
const deploymentSummaryFile = path.join(
  __dirname,
  "../../.docker/deployment_summary.json",
);
const wagmiConfigFile = path.join(__dirname, "../wagmi.config.ts");
const schemasFile = path.join(__dirname, "../lib/schemas.ts");

console.log("🔄 Updating config files with latest deployment data...");

try {
  // Read deployment summary
  const deployment = JSON.parse(fs.readFileSync(deploymentSummaryFile, "utf8"));

  console.log("📋 Found deployment data");

  // ========================================
  // UPDATE WAGMI CONFIG WITH CONTRACT ADDRESSES
  // ========================================

  // Collect all contract addresses from different sections
  const contracts = {
    ...deployment.eas_contracts,
    ...deployment.service_contracts,
    ...deployment.governance_contracts,
    ...deployment.reward_contracts,
  };

  console.log("📋 Contract addresses:", contracts);

  // Read current wagmi config
  const configContent = fs.readFileSync(wagmiConfigFile, "utf8");

  // Update contract addresses in the config
  let updatedConfigContent = configContent;

  // Map deployment contract names to wagmi config names
  const contractNameMapping = {
    attester: "Attester",
    eas: "EAS",
    schema_registry: "SchemaRegistry",
    schema_registrar: "SchemaRegistrar",
    indexer: "Indexer",
    indexer_resolver: "IndexerResolver",
    trigger: "EASAttestTrigger",
    voting_power: "VotingPower",
    governor: "AttestationGovernor",
    timelock: "Timelock",
    reward_distributor: "RewardDistributor",
    reward_token: "RewardToken",
  };

  // Update addresses for each contract
  Object.entries(contracts).forEach(([deploymentName, address]) => {
    const configName = contractNameMapping[deploymentName];
    if (configName) {
      // Find the contract block and update the address
      const contractPattern = new RegExp(
        `(\\{[^}]*name: ["']${configName}["'][^}]*address: ["'])([^"']*)?(['"].*?\\})`,
        "s",
      );
      const replacement = `$1${address}$3`;

      if (contractPattern.test(updatedConfigContent)) {
        updatedConfigContent = updatedConfigContent.replace(
          contractPattern,
          replacement,
        );
        console.log(`✅ Updated ${configName}: ${address}`);
      } else {
        // Check if contract block exists but has no address field or has comment
        const contractBlockPattern = new RegExp(
          `(\\{[^}]*name: ["']${configName}["'][^}]*?)((?://[^\\n]*\\n\\s*)?)(\\s*\\})`,
          "s",
        );
        if (contractBlockPattern.test(updatedConfigContent)) {
          const addAddressReplacement = `$1\n      address: "${address}",\n    $3`;
          updatedConfigContent = updatedConfigContent.replace(
            contractBlockPattern,
            addAddressReplacement,
          );
          console.log(`✅ Added address for ${configName}: ${address}`);
        }
      }
    }
  });

  // Write updated wagmi config
  fs.writeFileSync(wagmiConfigFile, updatedConfigContent);
  console.log("✅ wagmi.config.ts updated successfully!");

  // ========================================
  // UPDATE SCHEMAS WITH SCHEMA IDs
  // ========================================

  if (deployment.eas_schemas) {
    console.log("📋 Schema IDs:", deployment.eas_schemas);

    // Read current schemas file
    const schemasContent = fs.readFileSync(schemasFile, "utf8");
    let updatedSchemasContent = schemasContent;

    // Map deployment schema names to code schema names
    const schemaNameMapping = {
      basic_schema: "basicSchema",
      compute_schema: "computeSchema",
      statement_schema: "statementSchema",
      is_true_schema: "isTrueSchema",
      like_schema: "likeSchema",
      vouching_schema: "vouchingSchema",
    };

    // Update schema IDs
    Object.entries(deployment.eas_schemas).forEach(
      ([deploymentName, schemaId]) => {
        const codeName = schemaNameMapping[deploymentName];
        if (codeName) {
          // Find and replace the schema ID
          const schemaPattern = new RegExp(`(${codeName}:\\s*)"([^"]*)"`, "g");
          const testPattern = new RegExp(`${codeName}:\\s*"([^"]*)"`, "g");

          if (testPattern.test(updatedSchemasContent)) {
            updatedSchemasContent = updatedSchemasContent.replace(
              schemaPattern,
              `$1"${schemaId}"`,
            );
            console.log(`✅ Updated ${codeName}: ${schemaId}`);
          } else {
            // If schema doesn't exist in file, add it to the schemas object
            const schemasObjectPattern = /(export const schemas = \{[^}]*)/;
            if (schemasObjectPattern.test(updatedSchemasContent)) {
              const replacement = `$1\n  ${codeName}: "${schemaId}",`;
              updatedSchemasContent = updatedSchemasContent.replace(
                schemasObjectPattern,
                replacement,
              );
              console.log(`✅ Added new schema ${codeName}: ${schemaId}`);
            }
          }
        }
      },
    );

    // Write updated schemas file
    fs.writeFileSync(schemasFile, updatedSchemasContent);
    console.log("✅ schemas.ts updated successfully!");
  }

  console.log("🚀 All config files updated! Now run: npm run wagmi:generate");
} catch (error) {
  console.error("❌ Error updating config files:", error.message);
  if (error.code === "ENOENT") {
    console.error(
      "💡 Make sure the deployment summary file exists at:",
      deploymentSummaryFile,
    );
  }
  process.exit(1);
}
