// Schema UIDs for EAS attestations
// These are the standard schemas used in the application

export const schemas = {
  basicSchema:
    '0x987e6a6587aaeb5b7066528fce3465fc990edeb206525522c2d1944cdb1949ea',
  computeSchema:
    '0xed27039790a661bcb38cb0f2b3403c15104072c70b95c1b16453c78d202944b2',

  statementSchema:
    '0x587c058e08a6666ef63f0250307317347edc3b0a87323545236ed26233d8877c',
  isTrueSchema:
    '0x6dd845489f27e47bec122500f8a53cde22db99d536f8d253f68aeab8df79ee45',
  likeSchema:
    '0xaf8c9fc453e604e5fe6c166a1cf2c73f980ad9cebb62cf7b618028077839484d',
  vouchingSchema:
    '0x2f274a9da8f875389020c382cd007cc7922d7b10b6af4822b5bde703e41559c7',
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
