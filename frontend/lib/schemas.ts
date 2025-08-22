// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0x55df5aa83b9c9733044d6be1a8e679a567590dbd7c1aa037e47f2c691505eef6",
  computeSchema:
    "0x1859b0318814e6ad29076f3091d494692bd45a12a2c109e9168dd1c69cd97909",

  statementSchema:
    "0x319f20a71cf2910f6de7c7680b13877912006a7945d688950a0f96933a4f0309",
  isTrueSchema:
    "0x5de7ba4d13480059d6e3698df0a5a47fb532207fdefc66aa5dad5fe499e8815c",
  likeSchema:
    "0x9183722a6a63feb04179f29208a0d957c7abaa827f845cfdd6075d03c8daf5eb",
  vouchingSchema:
    "0x82a415f7c1e8d3721f98075b7da91803594667564f85965eb740ed92d34a8d53",
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
