// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xdd90b04ec9c78d86e6a228c9760eecbfbab2ae20e7b6c2ff27d878a5be6295b4",
  computeSchema:
    "0x71d0c8bd2690e89fe087a5038c611906cc7c126aaadfacd15d7520f48de9897c",

  statementSchema:
    "0x3ae9ec0af6526433cf531b7c1e88e3449be0079b9888a21c81f092f944c43123",
  isTrueSchema:
    "0x2bd7b43b3a29031a9c026bf98ff45caa92562b46979d5fdf852f83ed469412fb",
  likeSchema:
    "0x8d71a122131396ea83dcc33d975b018fa2dac82854f6643a299c24776bb6d4a4",
  vouchingSchema:
    "0x925ed53832bfd3edc2b86a95f715b8ec3f12f9f62cef2094f6fedc2f3b975429",
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
