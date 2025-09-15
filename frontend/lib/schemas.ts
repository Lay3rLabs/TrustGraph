// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basic: '0x79ddb98363da6ec325dc05ff604dabc83d9417e29294aaadb0ef8579539d98e1',
  compute: '0xf6613beb6dbc9d4a7e10709b67509cf347d389add57b20578ab8714b9bd5196e',
  isTrue: '0x78ed0fc0ad68eb9a5df034d79c5eff89c3e441f7d1efa322fe596bb571a2686b',
  like: '0xebf0f7025706470399878c25cbc3f8186256fe34e20e841a47e50ae2887a93fc',
  recognition:
    '0x05b1a21a00741f9f161d2c8d5f64bb50d6bece7c20a7d2d4d4cce1c1f556f626',
  statement:
    '0x78a1b4e9b90d4a1c447f4db2a11feea5b0d63e60e13c79b63fd8af741ece9312',
  vouching:
    '0x48723688dc5a064b7f6d6e8a9b66936ab801afedd0af291d483e0383ac8f4339',
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
