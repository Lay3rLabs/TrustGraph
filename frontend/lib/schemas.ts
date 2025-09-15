// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basic: '0xd40a96050fc6b3597370561cb4a13ae5a413fe5f14567705823480ab76efd1d1',
  compute: '0x576d58f10081bac23b97a05185f8431d4c20708df31a56559bc6ea2c8eac5d76',
  isTrue: '0x9e08f42eecb598f114c1a84acee52c15138b70151a58e0b67f8dac3044d78040',
  like: '0x92436c71ee6206637f1068e0e245f7b5bb9f12fdb7975120d9fe5d61608d970a',
  recognition:
    '0x770239f8ef13ea9db6901fb5a49d13588bc59c76fd3d34f1369834ce103029ec',
  statement:
    '0x8f7f209355a83574d069e7766887ca71857b3b027637068c6deda74684793bf9',
  vouching:
    '0x256bdd9f80fb1f6c0a01fddf5030c9f84b787a4500f92995b7b949e33e216d1b',
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
