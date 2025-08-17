// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x873a435999fe85fae23e3f57280541d8eb991f1e2e2178e212bb9bf983c6d07d",
  computeSchema:
    "0xce71f47f9a554356d1d6633c032988fca9ef08d7ba8c8489eed4881e55a848b6",

  statementSchema:
    "0x94c14c19ceebbfae2cb10c015cca9d6041252074eca263401f6bfa041c89dbc3",
  isTrueSchema:
    "0x0415bc32e6564d24bcbf25bdb020d024582be7651c91d2e39164bd0c688d09bd",
  likeSchema:
    "0xcf915a02dd10ef5d70a20208c3712b5773dabe8f3aba5fe655731db4e9a3834b",
  vouchingSchema:
    "0xdb173760eae01d93805ecfdaa9fa617de27f80a8157cf4d134055ef8a0e32e7f",
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
