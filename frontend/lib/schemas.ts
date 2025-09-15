// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basic: '0xc980e5e905de5bca146f9f17de9daf14fd1b47410f5d5ab22a0321973cb45654',
  compute: '0x2204e7868f058bb318f73df05cf4891ce39619bad60d3bd0616a794c01336d7d',
  isTrue: '0xe7e78ec1cbceaa5ab426b79f4c08918a51872e8bc7e29a723e8e50ca6d512cd2',
  like: '0x4a4f78b9013d8fa386c4d314a08621ba2013f406c8e5a74d3a3ec2a72248d3b4',
  recognition:
    '0x5944cb207b341518dad0566a162338f4edef6ece02f943eb358c148c9e401129',
  statement:
    '0x9644aff4d90297c41725b170b41fad6d34ab111b411a6753d061f1504107624c',
  vouching:
    '0x337d7ea9963c0cdeaafc47b19cdb8bd38fd43b6c72c9df9af3b67762cf24467e',
} as const

// Schema definitions with metadata for UI
export const SCHEMA_OPTIONS = [
  {
    name: 'Basic Schema',
    uid: schemas.basic,
    description: 'General purpose attestation',
    fields: ['message'],
  },
  {
    name: 'Compute Schema',
    uid: schemas.compute,
    description: 'Computational verification',
    fields: ['result', 'computation_hash'],
  },
  {
    name: 'Statement Schema',
    uid: schemas.statement,
    description: 'Statement',
    fields: ['statement'],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouching,
    description: 'Vouching',
    fields: ['weight'],
  },
  {
    name: 'Recognition Schema',
    uid: schemas.recognition,
    description: 'Recognize contributions',
    fields: ['reason', 'value'],
  },
] as const
