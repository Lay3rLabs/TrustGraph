// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x48edef02ce5473dc13efea9e1e1dcafa650d999bf71d9bc51f60c1ab90a08959",
  computeSchema:
    "0x0c9f23942af461904423d56e770fa545b9c83626843ffa0a9affc9399ecfac59",

  statementSchema:
    "0xc56b040a3bfc1965e88e7f8591577e89576bf0ccbf995d698449feed121db6f9",
  isTrueSchema:
    "0xe58fe4a19f90739b051245e80ac63e789f7d737624c675d21d632f0d766f860a",
  likeSchema:
    "0x6dccbb3de2491fb09e7395c323c56c66000c1457280d3cd3c362bc4f16a9c7fc",
  vouchingSchema:
    "0xcbfca9b84cdad0ad860021f7f9fe164aac57025021927edd01b12d9d26a9294c",
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
