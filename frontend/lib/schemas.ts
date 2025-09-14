// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x54972cdc8c60c68aede064ff684e871cc6ad555008782851c8681f946a74ae36',
  computeSchema:
    '0x4dc0876edc313a8bb2176cfac460f94ba8033b3142ed4845e72e6fc2bb17f0f8',

  statementSchema:
    '0x37156d7842a41d4675a4756b8bfcacf73df63b93f56d9fc50b9adde5511bf507',
  isTrueSchema:
    '0x9b39361e1d3be3b20641dc882c44e1946bf9eecd2ce814919bf4ab0a20e0539e',
  likeSchema:
    '0xa81709c208883b2c457da9d4ff984fdebda927e560770b1dc3012286ed6c3837',
  vouchingSchema:
    '0x54ed073e0e1bcd6c6b5941a2fc91dab9726f65ac58e98b71d7f4b42f0baa2565',
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
