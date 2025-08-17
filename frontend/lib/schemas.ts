// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x411ef754458a67ad603ea25009902d9c5bbbb2136e74b35bce7af73cf2a2d865",
  computeSchema:
    "0xc6026797ccaddd99946c103027e70110bcf0f7b63d88fb2e5d8a0e7cc0bcf884",

  statementSchema:
    "0x83f82b9eb4565fafc4645fbddeeb96d8dd55415dfc30dddda9dbd3abe4e570ed",
  isTrueSchema:
    "0x51b1b99929628b8eb5386a818e64ff125842796b82b1fce7a7d7b161971f514b",
  likeSchema:
    "0x8b5a4b33e461b148b5445ea9d2c484564b3f37293c9eebecdfbacd38168cfc4e",
  vouchingSchema:
    "0x20b391728604f7da543c3c9bd46094ab9ac19571759e799dd7370109ec31c78b",
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
