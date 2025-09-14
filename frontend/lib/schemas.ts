// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0xab60c91837d749d37b591974d2e1415b414c94731e23acf66700957aaa09ca91',
  computeSchema:
    '0xeab0789ac5114d4e44cdc8c47b6123d656fb1522574a8fe79acd85c1e358257e',

  statementSchema:
    '0xa758b36bd319454b45ee528f69fa2d28dbff352c98bf82fcef3e8a4d79c03ace',
  isTrueSchema:
    '0xa9223ad335f434f33eef5c8e0409cdb3112942a9f7fe392030de76b4a2e7cfdf',
  likeSchema:
    '0x35a8ec184611e79dde3801db7dd9907f44bd3a4828f68f38f3b1339a73d96c2f',
  vouchingSchema:
    '0x0e643761fd3a6f313495e9b399ba2a36ade1fc70ecfc4836c6cff679077092ec',
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
