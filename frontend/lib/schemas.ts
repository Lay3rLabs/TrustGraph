// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x8b574ccc3c53ce85089ffe8c1d67320df028a9d737203bda91c0c17b310d7c31",
  computeSchema:
    "0x8d7d5d3e3f10d324fcbe62424f350baac3438526bff0be7d76a0f4193fb8a6db",

  statementSchema:
    "0xc8307686e21a8879fb1793346a64fc2cda42029352682527a450b73f70056682",
  isTrueSchema:
    "0x7330943e0a76c4870cfee9630fbe7fc9b0217bd17c1eca3d3df43b2a4cefd736",
  likeSchema:
    "0xead41fa3024b38c018376e8c638b30144f548025d87649f69b18a97453c4104a",
  vouchingSchema:
    "0xc3137e5c3f28c2cf8238881e7c3492526b97f941b8a699ebba6fd283dc236789",
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
