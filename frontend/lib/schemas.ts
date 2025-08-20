// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xa1695e51b8c0849aee5273efc5674133e42ff9ecd173e0e9888eb759af8a5c2f",
  computeSchema:
    "0x5dbf04f470fccb2553ca520317c3cc918915c7f080e24c42ed2d7c77a51475ac",

  statementSchema:
    "0x5a9aee75433ae91fc6a56ad7d5f8ced4739a26c5aa9c743633ca77f4debc8b73",
  isTrueSchema:
    "0x9543ea6362240d88f292f784d4d1b46a25cb379f0cb3778340008cc378b09e5b",
  likeSchema:
    "0xaf59cd9c89aa6f653da19ed2b3eac324292ee9905cb1289eb4f49aac4c5692ad",
  vouchingSchema:
    "0x930a7320acd81838154f02f68de5d2873af092a0b3b15262197cb5cc525e192e",
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
