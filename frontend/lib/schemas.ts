// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x9b7d563bd1f7d516601b699afa8a3642b4da3a1c249c3144b1188474d5d67df1',
  computeSchema:
    '0x1c66b2afec92888df07bb90d15bac75214e45f52e65707e35f6e4f84243e7b8a',

  statementSchema:
    '0xccdd47d6be6d5ab3cb2a62b36777ea592c75307956066f0cca5142074a33f60e',
  isTrueSchema:
    '0xeb92be5b9dd2190ce5f2dc948405addafc153403dbeaf5ab38e5d67a4a487068',
  likeSchema:
    '0xfc1994a1c342803d3e13cd91296ec7c8ec1d1bc74a6032a1f06e8152782547f9',
  vouchingSchema:
    '0x4ab9bbb3aa30ee22fc2cd509ee36e43750d6fa108261e03a1c6c4bf1e8885daf',
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
