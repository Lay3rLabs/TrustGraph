// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basic: '0x0fde621f7f4b76e4954d75cb96903ca3581931678a66758f4de1224a5bdbd114',
  compute: '0x0a550ccef4ab477ac9e1e266f6b94e8e6ffba859f372f4ff4a7932b7eb416129',
  isTrue: '0xab61910e745f7a8b2757d436f8ab1cf1b492ae59a327c0fa9e991c87ec92da25',
  like: '0xbdbf2de21d4536e52a8f9a380d48664cc2afb5eed766d9d606cd9886200f7fb1',
  recognition:
    '0xf6e6f7c97e847dc06af70d0eca892383f80ee29e56991b131808253e96413af2',
  statement:
    '0x91f59114dd2cc6cc808b23eac90b165c33b6eaf59aedbfdf4a7463ff6790de69',
  vouching:
    '0x81fc70d5dee5f714c7b1950e7f7f4771c94e681aa831d5dbeaa8e9cdd33b7bf7',
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
