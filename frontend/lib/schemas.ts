// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x8673d6664df11f591b690bd27672473634cb7e33ae5112f0715bce727410695e',
  computeSchema:
    '0xcc1055651555f391ef27d2bf820b370617b76f1bfddc37f51f6884d63d469ffb',

  statementSchema:
    '0x64cc56c252b57e220b955c314fa71c13f2ce1d9ed2f25c0c36a964d3bd2bd2fb',
  isTrueSchema:
    '0x3896e6454860a6850b343b86d063e3080bddecd47d702a43e04f3eafadea387a',
  likeSchema:
    '0x489405cb9e5065873af4108f5d7de6ed691c5a4f8da4c77c7eae4b4d804cb94b',
  vouchingSchema:
    '0xe8b7212494c413224aa692145122b9b8befadfa76ffe7b13f4e8708fe6949c5a',
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
