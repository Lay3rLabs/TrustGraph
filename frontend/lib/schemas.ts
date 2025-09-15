// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basic: '0x8d678dc31abd4654d541224c461d6e0d68627d10da0631a31af5e89f8fbae41c',
  compute: '0x3f850373c344021a30a71b91f374dd128121bd4ae3ce2bdf79eac31f5c052f3d',
  isTrue: '0x5d2e532bdb76b9fb68ab76282eb9b734ee663ec09b1db904de8aceab5e7ffe40',
  like: '0x13c1e7bebcf3ec21ff7168f226660e7db6e60b9627360959dd2b5f965e749652',
  recognition:
    '0x191e9e464d25de14fd7bd2f11c098ecfebbe54ae821b8947785e177f597c5636',
  statement:
    '0x502046f541b03a5afa1eff7d8ad2776777129ae0deb03d0d9e45bcda6b82df6b',
  vouching:
    '0xe5ef85e4d9ebaa795c27b9b9d9c700ce7bbf4d3d7b64c48c3326e77a1c40584b',
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
