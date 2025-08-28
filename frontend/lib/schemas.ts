// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x8baaedd77c5f8061341057a07f25f4001ca4aec2161d605227de48340b92a373',
  computeSchema:
    '0x3d8eb381b748532728fc6dce99ee0f11e7afe816389798072c290afba099e563',

  statementSchema:
    '0x59ebe58a14ec7b665d291b68914a1c6337f2729514180183604e678eb25bcf73',
  isTrueSchema:
    '0x177e428e1d7d2b5e86f73aa53f26d0f859f0d862a6276a4e393ac841f1427c90',
  likeSchema:
    '0xf10c411a56ca7ad67a6382d20f15d50f52c10ca16c2bf30d68692000b3388563',
  vouchingSchema:
    '0x9030b8a8bd235d4f63fd7d4abd94e6b79e6ff2b650f5ff50000627a891e76674',
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
