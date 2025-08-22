// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x18f825246e7b7d90e00e8261a1e53cf61fa6c4481b3249959d0552cbdef2280e",
  computeSchema:
    "0x94135c5bacfd8d500ff9c6bf115d0c42300b699a2f25e6dcc2095ba8137bc5aa",

  statementSchema:
    "0x7f8113c6091d3d311afe620d5ab4c690f114922caf3c12fb7b38e3e7fffc6368",
  isTrueSchema:
    "0xd443c1e48ea15a1cdcf186e0ba41dc4a98629337adffc8fddec0ee7ebf00fc14",
  likeSchema:
    "0x1f0eb6715acbd741b7ba2ee6ff3319759786e33668db7a86426cca3b4034ccff",
  vouchingSchema:
    "0x762b2eb5a6a7f40edbd7b3d8b5a9841502e306ad286eda42a6a5eea35b459fd7",
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
