// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x9aee592dfed4e3a6096a996d1e0089c9593ca454020149c222eb32dacea2108b",
  computeSchema:
    "0xe117d135d5aea3b607dfb92ba605e6665bf8873d6066d19587e3c9ab52016d21",
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
] as const;
