// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x8e975bb9932aad9c2a5bc973ebd2b6fa9feb9590ffbfb83a2c40e8179859c160',
  computeSchema:
    '0xb33e3004b4ad1b9d733fe696f4f9e882a6fbbabf2478888e5a8d98c082e05f16',

  statementSchema:
    '0xf9b77b760b182e2d1b841f5a4b48b965986aed1280c464837fd948e1fc28ab48',
  isTrueSchema:
    '0xf557168bf777bbda06f79bdac45522d64d8fc9cffefedd063481c8d78df1130c',
  likeSchema:
    '0x4dd5b28e93ad5610a8e109c909a16ce3a67b40f364da8ab72e081528a9440af3',
  vouchingSchema:
    '0x166109c6111205f622d40478192be94b71ef5ed074b55289927f07573c7ff362',
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
