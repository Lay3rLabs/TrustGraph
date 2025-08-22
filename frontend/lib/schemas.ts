// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    "0xfab9a5632d580efc1c12750ae76c1fc78e00b556c92aa870bb26357f4034ad2c",
  computeSchema:
    "0x29dde9596ec8da6426b2686df98e9d6040113a7fad342707af845458725a35ba",

  statementSchema:
    "0x5b2dfb665afe54d218c8807225857636a1f3c0cef19748115c9cc23926eff615",
  isTrueSchema:
    "0x889377189af2d284fe459bbbb0d0803022c6996f56837b3e224c7952427df88a",
  likeSchema:
    "0xd122870740877bba1e6535a063e2712a84b13f9112af5c0c43bcc9b18fbc67aa",
  vouchingSchema:
    "0x0e9ec842bcb60da2210382af199741460317bc222153a00ccef3ea0b3c5e0b60",
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
