// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x400dbdbd3d5d0de7f895c90ae00fd0e9d703d96ccf3310f794735e8fdaca31f0',
  computeSchema:
    '0x648388d8ace300dcd86fd56c9914d1f46b9ffab0554da568f144ac3e1dc6ba8c',

  statementSchema:
    '0xbfd34c405311ee8911114434fb1c70450f5cf0e68e7ab980b3bd3caf66ec97d7',
  isTrueSchema:
    '0x2f234efbc19d45f191b034af09d02d0c9c89049176b3eeb28985864d6fc0853b',
  likeSchema:
    '0x9f266d5e5bf7ef538ef93db00c8c937dd610d088d7767de6c4e4aa91ec29d9bf',
  vouchingSchema:
    '0xc8fca51f7e4fe37babd237e1bdbe4a889f35cd4cb2d1c22d667bad1be0233def',
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
