// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xffbd1243669376dd94184bff8f0d90a6dcae5ee82a90ea9da6d2969fdb4063db",
  computeSchema:
    "0x2f53fecb61d6d7104df2481c9d7947f1b4ac5ef4d1684d143e884b9d9d2728dd",

  statementSchema:
    "0x7faea253c71ee0cff9c257286849c961f70a3703b140d5cc4999e6599e8af7df",
  isTrueSchema:
    "0x5f5dd62a6aabd1feeaa8c31e1e3e2ba451b21946f9e229ffbe31ae53c2ea40e6",
  likeSchema:
    "0xc5ef73119765eee754f43623609c87304af5ed8f89d4ac939aa826992d7b13c0",
  vouchingSchema:
    "0xcc63cbe02c608624f7e8c272c64948f1418bb7b4217c18178f0c4d32cfcca5d3",
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
