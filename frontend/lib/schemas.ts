// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x44e5a7f75eeb802a8beb8f5bd941ad96fe6700abc68ed181536ed9b9fc825616',
  computeSchema:
    '0xcba9bb8cf4b187a1e6dd872ae51df563119f2b353fcbcbf3c53a35c1f92cf7b9',

  statementSchema:
    '0x84dcd31fa07cccaf5beee742cb4511b12ea129ea0b53ef8e74da8d76e79fcac0',
  isTrueSchema:
    '0xdfb4f50d3bd5fe8c220acb8869ee6208c0282e6b990c2c50eb5687a729530e90',
  likeSchema:
    '0x41cc8ae6f675e3c0c7f0ad9acb2bae68fd17d03ccb61f31319dce5b5af571395',
  vouchingSchema:
    '0xce29df085572e622803112ff6698ce2a5129d35e193de7b662fb6e40089667e5',
} as const

// Schema definitions with metadata for UI
export const SCHEMA_OPTIONS = [
  {
    name: 'Basic Schema',
    uid: schemas.basicSchema,
    description: 'General purpose attestation',
    fields: ['message'],
  },
  {
    name: 'Compute Schema',
    uid: schemas.computeSchema,
    description: 'Computational verification',
    fields: ['result', 'computation_hash'],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouchingSchema,
    description: 'Vouching',
    fields: ['weight'],
  },
] as const
