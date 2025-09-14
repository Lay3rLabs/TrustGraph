// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x90e71afa003878030c31520fe8f358ea0a75b5a02195aed3829f4617cd5bc66b',
  computeSchema:
    '0xe0bc3d857ea782a532801c3ecf9d245b51b39fa089b64bee1e8aef0ee42b0ff9',

  statementSchema:
    '0xbe9d5a2bc7d4c072570af3f1b13993c923022a3692e1e17f6f1ce076bdcc30c2',
  isTrueSchema:
    '0x27c4341ac7663fefc950ace1164eac94d459c8cd16d82220bbe2d80d19189d14',
  likeSchema:
    '0x166463c3679ebcfa50ccfdb32586eb0546dd65937799e8b4e2be7c987a317cd5',
  vouchingSchema:
    '0x4c9e01d8db8a581331f84f106fed51927723ed7a4fa565502d27a0132d3d9dd6',
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
    name: 'Statement Schema',
    uid: schemas.statementSchema,
    description: 'Statement',
    fields: ['statement'],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouchingSchema,
    description: 'Vouching',
    fields: ['weight'],
  },
] as const
