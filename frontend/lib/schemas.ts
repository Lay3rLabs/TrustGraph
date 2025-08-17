// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xcc39614816d340125da695054bf6a7fefc2259fad6a2bca02ab1a261c11e8f5a",
  computeSchema:
    "0x9a51dc896c07301e076110432c8ec4572e8a7c4df9934e0b3739dc3de8c44075",

  statementSchema:
    "0x337b10ab228be572eae49a8aabe8aac1ad11ec156a6aa01515f9d92d6721b9e5",
  isTrueSchema:
    "0x4d64e366e7d9bec687415e1a78d194856c4ecc075069fbd752317680a4d306a5",
  likeSchema:
    "0x3861d3cd2ef402a117bacf510cd869f54b6f8cedcdc48c146d84f314e6c1ff93",
  vouchingSchema:
    "0x06945b491742524d215af4b79a93146dceea14b49d65fd29c991bdbb4ce7d8bb",
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
