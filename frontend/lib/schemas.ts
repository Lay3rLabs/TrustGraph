// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xe1f5299a0eedcc1bd2306423772c593dca17c84615c5d4e7714e7a17a1669c86",
  computeSchema:
    "0xd58b91a794c9a06deaf41454a6108786ec40a584e7b0f12f33c0cde5fe8bdb3e",

  statementSchema:
    "0x16b6a5444eb06f876ac1f4fb88ff32b8c3aa90586a20d6398a81d7d598d35dec",
  isTrueSchema:
    "0x0ddb8dabca661b4356a4a2326e67101088f5f9c7a33d82b5f676829aeb53aeaa",
  likeSchema:
    "0x3f9e8be4c1f31c8d6f14d337ba485eb0a7ef585b0f2644b5c873c63df0f8b249",
  vouchingSchema:
    "0xb6a8316013a071732f899693101a681806d122323ccec32ddcbc58b83b50bb73",
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
