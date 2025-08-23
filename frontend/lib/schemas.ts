// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xd84f4b8fc4889da41d7ef079e694ad32e745dea8254c9e75f910f0e9217a7706",
  computeSchema:
    "0xe4e1cc2833ebf86a88a004a654196c71cfe7011fc1fcaccc5b8ab4acee8e9199",

  statementSchema:
    "0x4e425a5ed8d04e3a202495b645790732f7855b0c6c0cf29ec596fda26fb219e8",
  isTrueSchema:
    "0x114d391b27b3c3153f401bf47d86a0b00af6e9e6ed8ddd465daa2895e9d96465",
  likeSchema:
    "0x930895f4474e93edc07742fbecc87dd3aa96e14fcec01c06ce93cd52d7d9707c",
  vouchingSchema:
    "0x386353bac712eca630cf30b0d00fc5f67d95e6268131c5a0ab87e6458fba8743",
} as const;

// Schema definitions with metadata for UI
export const SCHEMA_OPTIONS = [
  {
    name: "Basic Schema",
    uid: schemas.basicSchema,
    description: "General purpose attestation",
    fields: ["message"],
  },
  {
    name: "Compute Schema",
    uid: schemas.computeSchema,
    description: "Computational verification",
    fields: ["result", "computation_hash"],
  },
  {
    name: "Vouching Schema",
    uid: schemas.vouchingSchema,
    description: "Vouching",
    fields: ["weight"],
  },
] as const;
