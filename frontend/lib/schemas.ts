// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basic: '0xc41d4a3ea0e1b63f022ca49791e97b926456ce788396286c2834920cedee1dd4',
  compute: '0xeaa40cdb1e1da3457aa045b2fced00669310cdf4873553e0e3c7b26655a59539',
  isTrue: '0xa7d093c590cd1dfbdd9fcda58868e42008668854fe6b781a77132e21fe5f0694',
  like: '0x573467412e507c107c6d1b844477463466809ab46bf5fa6b69b4f04e5286dc63',
  recognition:
    '0xd3452b605ea9dd1ec5c054850b432ed7ccccb08ad7bac30060cd5ffb478e1003',
  statement:
    '0x0991a7b55af8e243810abac66d4eb5a00722a30371c5d3521329d61f5d751e0b',
  vouching:
    '0xe11a607d50d31e0922b773f584933538414fde5663e06a4074766bc620b2d7db',
} as const

// Schema definitions with metadata for UI
export type SchemaFieldType =
  | 'string'
  | 'bytes'
  | 'bytes32'
  | 'uint256'
  | 'address'

export const SCHEMA_OPTIONS: {
  name: string
  uid: string
  description: string
  fields: { name: string; type: SchemaFieldType }[]
}[] = [
  {
    name: 'Basic Schema',
    uid: schemas.basic,
    description: 'General purpose attestation',
    fields: [
      { name: 'triggerId', type: 'bytes32' },
      { name: 'data', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    name: 'Compute Schema',
    uid: schemas.compute,
    description: 'Computational verification',
    fields: [
      { name: 'triggerId', type: 'bytes32' },
      { name: 'computation', type: 'string' },
      { name: 'result', type: 'bytes' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'operator', type: 'address' },
    ],
  },
  {
    name: 'Statement Schema',
    uid: schemas.statement,
    description: 'Statement',
    fields: [{ name: 'statement', type: 'string' }],
  },
  {
    name: 'Vouching Schema',
    uid: schemas.vouching,
    description: 'Vouching',
    fields: [{ name: 'weight', type: 'uint256' }],
  },
  {
    name: 'Recognition Schema',
    uid: schemas.recognition,
    description: 'Recognize contributions',
    fields: [
      { name: 'reason', type: 'string' },
      { name: 'value', type: 'uint256' },
    ],
  },
]
