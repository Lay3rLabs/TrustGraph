// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x3a5a8b2fe9153f843785c21e0e2deb7325dfe736c0ae1f94a0c9e17800e4df3f",
  computeSchema:
    "0xfae25580a407a0a27c677412f6d86bb0e6e91091eb6bd3f3be109b7d27896e04",

  statementSchema:
    "0x98b30903bdb06df22636575df89656f7fff5fc12d528fdd5023d26722a42f920",
  isTrueSchema:
    "0x7a315c7a36da24defab23dbe9f44ff7132f6e04eefd7b67204f45be5c42b1e2a",
  likeSchema:
    "0xca6d9c747d9733302a267b4a3e2a793e22f15f0da4a2806c5d2f8f6a7f92a5df",
  vouchingSchema:
    "0xec5c6319f110de613a93503cb9d47d7a9dceb7c1c64b98b75b3170648ee4e836",
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
