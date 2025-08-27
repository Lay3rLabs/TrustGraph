// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x4b088a3a439b0fec7a40df3c64403dd0bd38623e663350b6c26acbeecb568ddb',
  computeSchema:
    '0x74fc921815cc6a6977bfcb62912992e32f45b20f43e341a35b19bd33aa83085c',

  statementSchema:
    '0x7b174df4e18ee23a739beaa045f6cbb4cb172fbe93c36fd8be64c84ca07fc4b3',
  isTrueSchema:
    '0x01fd5864d5ab69adf02a1af806f59c194cfdf39df0b2a70dec68efcce2afa392',
  likeSchema:
    '0x616651f89248d95a1c0f81d2efb7897e203dc3f702dffc511a89458918b148bd',
  vouchingSchema:
    '0xa9e5b20b7e3267cd2274063c848bafa970c16468414490958ceca70d58666a9c',
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
