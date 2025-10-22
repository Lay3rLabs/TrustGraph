//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EAS
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const easAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'registry',
        internalType: 'contract ISchemaRegistry',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'request',
        internalType: 'struct AttestationRequest',
        type: 'tuple',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct AttestationRequestData',
            type: 'tuple',
            components: [
              { name: 'recipient', internalType: 'address', type: 'address' },
              {
                name: 'expirationTime',
                internalType: 'uint64',
                type: 'uint64',
              },
              { name: 'revocable', internalType: 'bool', type: 'bool' },
              { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
              { name: 'data', internalType: 'bytes', type: 'bytes' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'attest',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'delegatedRequest',
        internalType: 'struct DelegatedAttestationRequest',
        type: 'tuple',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct AttestationRequestData',
            type: 'tuple',
            components: [
              { name: 'recipient', internalType: 'address', type: 'address' },
              {
                name: 'expirationTime',
                internalType: 'uint64',
                type: 'uint64',
              },
              { name: 'revocable', internalType: 'bool', type: 'bool' },
              { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
              { name: 'data', internalType: 'bytes', type: 'bytes' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'signature',
            internalType: 'struct Signature',
            type: 'tuple',
            components: [
              { name: 'v', internalType: 'uint8', type: 'uint8' },
              { name: 'r', internalType: 'bytes32', type: 'bytes32' },
              { name: 's', internalType: 'bytes32', type: 'bytes32' },
            ],
          },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'deadline', internalType: 'uint64', type: 'uint64' },
        ],
      },
    ],
    name: 'attestByDelegation',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      { name: 'fields', internalType: 'bytes1', type: 'bytes1' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'version', internalType: 'string', type: 'string' },
      { name: 'chainId', internalType: 'uint256', type: 'uint256' },
      { name: 'verifyingContract', internalType: 'address', type: 'address' },
      { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
      { name: 'extensions', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getAttestTypeHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'uid', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getAttestation',
    outputs: [
      {
        name: '',
        internalType: 'struct Attestation',
        type: 'tuple',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          { name: 'time', internalType: 'uint64', type: 'uint64' },
          { name: 'expirationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'revocationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getDomainSeparator',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getName',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getNonce',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'revoker', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getRevokeOffchain',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getRevokeTypeHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSchemaRegistry',
    outputs: [
      { name: '', internalType: 'contract ISchemaRegistry', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getTimestamp',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newNonce', internalType: 'uint256', type: 'uint256' }],
    name: 'increaseNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'uid', internalType: 'bytes32', type: 'bytes32' }],
    name: 'isAttestationValid',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'multiRequests',
        internalType: 'struct MultiAttestationRequest[]',
        type: 'tuple[]',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct AttestationRequestData[]',
            type: 'tuple[]',
            components: [
              { name: 'recipient', internalType: 'address', type: 'address' },
              {
                name: 'expirationTime',
                internalType: 'uint64',
                type: 'uint64',
              },
              { name: 'revocable', internalType: 'bool', type: 'bool' },
              { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
              { name: 'data', internalType: 'bytes', type: 'bytes' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'multiAttest',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'multiDelegatedRequests',
        internalType: 'struct MultiDelegatedAttestationRequest[]',
        type: 'tuple[]',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct AttestationRequestData[]',
            type: 'tuple[]',
            components: [
              { name: 'recipient', internalType: 'address', type: 'address' },
              {
                name: 'expirationTime',
                internalType: 'uint64',
                type: 'uint64',
              },
              { name: 'revocable', internalType: 'bool', type: 'bool' },
              { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
              { name: 'data', internalType: 'bytes', type: 'bytes' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'signatures',
            internalType: 'struct Signature[]',
            type: 'tuple[]',
            components: [
              { name: 'v', internalType: 'uint8', type: 'uint8' },
              { name: 'r', internalType: 'bytes32', type: 'bytes32' },
              { name: 's', internalType: 'bytes32', type: 'bytes32' },
            ],
          },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'deadline', internalType: 'uint64', type: 'uint64' },
        ],
      },
    ],
    name: 'multiAttestByDelegation',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'multiRequests',
        internalType: 'struct MultiRevocationRequest[]',
        type: 'tuple[]',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct RevocationRequestData[]',
            type: 'tuple[]',
            components: [
              { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'multiRevoke',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'multiDelegatedRequests',
        internalType: 'struct MultiDelegatedRevocationRequest[]',
        type: 'tuple[]',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct RevocationRequestData[]',
            type: 'tuple[]',
            components: [
              { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'signatures',
            internalType: 'struct Signature[]',
            type: 'tuple[]',
            components: [
              { name: 'v', internalType: 'uint8', type: 'uint8' },
              { name: 'r', internalType: 'bytes32', type: 'bytes32' },
              { name: 's', internalType: 'bytes32', type: 'bytes32' },
            ],
          },
          { name: 'revoker', internalType: 'address', type: 'address' },
          { name: 'deadline', internalType: 'uint64', type: 'uint64' },
        ],
      },
    ],
    name: 'multiRevokeByDelegation',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes32[]', type: 'bytes32[]' }],
    name: 'multiRevokeOffchain',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes32[]', type: 'bytes32[]' }],
    name: 'multiTimestamp',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'request',
        internalType: 'struct RevocationRequest',
        type: 'tuple',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct RevocationRequestData',
            type: 'tuple',
            components: [
              { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'revoke',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'delegatedRequest',
        internalType: 'struct DelegatedRevocationRequest',
        type: 'tuple',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct RevocationRequestData',
            type: 'tuple',
            components: [
              { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'signature',
            internalType: 'struct Signature',
            type: 'tuple',
            components: [
              { name: 'v', internalType: 'uint8', type: 'uint8' },
              { name: 'r', internalType: 'bytes32', type: 'bytes32' },
              { name: 's', internalType: 'bytes32', type: 'bytes32' },
            ],
          },
          { name: 'revoker', internalType: 'address', type: 'address' },
          { name: 'deadline', internalType: 'uint64', type: 'uint64' },
        ],
      },
    ],
    name: 'revokeByDelegation',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes32', type: 'bytes32' }],
    name: 'revokeOffchain',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes32', type: 'bytes32' }],
    name: 'timestamp',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'attester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: false },
      {
        name: 'schemaUID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'Attested',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldNonce',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newNonce',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'NonceIncreased',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'attester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: false },
      {
        name: 'schemaUID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'Revoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'revoker',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'data', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'timestamp',
        internalType: 'uint64',
        type: 'uint64',
        indexed: true,
      },
    ],
    name: 'RevokedOffchain',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'data', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'timestamp',
        internalType: 'uint64',
        type: 'uint64',
        indexed: true,
      },
    ],
    name: 'Timestamped',
  },
  { type: 'error', inputs: [], name: 'AccessDenied' },
  { type: 'error', inputs: [], name: 'AlreadyRevoked' },
  { type: 'error', inputs: [], name: 'AlreadyRevokedOffchain' },
  { type: 'error', inputs: [], name: 'AlreadyTimestamped' },
  { type: 'error', inputs: [], name: 'DeadlineExpired' },
  { type: 'error', inputs: [], name: 'FailedCall' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'InsufficientValue' },
  { type: 'error', inputs: [], name: 'InvalidAttestation' },
  { type: 'error', inputs: [], name: 'InvalidAttestations' },
  { type: 'error', inputs: [], name: 'InvalidExpirationTime' },
  { type: 'error', inputs: [], name: 'InvalidLength' },
  { type: 'error', inputs: [], name: 'InvalidNonce' },
  { type: 'error', inputs: [], name: 'InvalidOffset' },
  { type: 'error', inputs: [], name: 'InvalidRegistry' },
  { type: 'error', inputs: [], name: 'InvalidRevocation' },
  { type: 'error', inputs: [], name: 'InvalidRevocations' },
  { type: 'error', inputs: [], name: 'InvalidSchema' },
  { type: 'error', inputs: [], name: 'InvalidShortString' },
  { type: 'error', inputs: [], name: 'InvalidSignature' },
  { type: 'error', inputs: [], name: 'InvalidVerifier' },
  { type: 'error', inputs: [], name: 'Irrevocable' },
  { type: 'error', inputs: [], name: 'NotFound' },
  { type: 'error', inputs: [], name: 'NotPayable' },
  {
    type: 'error',
    inputs: [{ name: 'str', internalType: 'string', type: 'string' }],
    name: 'StringTooLong',
  },
  { type: 'error', inputs: [], name: 'WrongSchema' },
] as const

export const easAddress = '0x4200000000000000000000000000000000000021' as const

export const easConfig = { address: easAddress, abi: easAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EASAttestTrigger
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const easAttestTriggerAbi = [
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'string', type: 'string' }],
    name: 'addAgentTrigger',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'string', type: 'string' },
    ],
    name: 'triggerRequestAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'triggerRequestRawAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'schema',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'AttestationRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'attester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: false },
      {
        name: 'schema_uid',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'AttestedEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'NewTrigger',
  },
] as const

export const easAttestTriggerAddress =
  '0xA91F15f5632A98278daBED81C4A6Fe87f9cF4161' as const

export const easAttestTriggerConfig = {
  address: easAttestTriggerAddress,
  abi: easAttestTriggerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EASIndexerResolver
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const easIndexerResolverAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'eas', internalType: 'contract IEAS', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      {
        name: 'attestation',
        internalType: 'struct Attestation',
        type: 'tuple',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          { name: 'time', internalType: 'uint64', type: 'uint64' },
          { name: 'expirationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'revocationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'attest',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'isPayable',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'attestations',
        internalType: 'struct Attestation[]',
        type: 'tuple[]',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          { name: 'time', internalType: 'uint64', type: 'uint64' },
          { name: 'expirationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'revocationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'multiAttest',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'attestations',
        internalType: 'struct Attestation[]',
        type: 'tuple[]',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          { name: 'time', internalType: 'uint64', type: 'uint64' },
          { name: 'expirationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'revocationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'multiRevoke',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'attestation',
        internalType: 'struct Attestation',
        type: 'tuple',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          { name: 'time', internalType: 'uint64', type: 'uint64' },
          { name: 'expirationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'revocationTime', internalType: 'uint64', type: 'uint64' },
          { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'attester', internalType: 'address', type: 'address' },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'revoke',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'eas', internalType: 'address', type: 'address', indexed: true },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: true },
    ],
    name: 'AttestationAttested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'eas', internalType: 'address', type: 'address', indexed: true },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: true },
    ],
    name: 'AttestationRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'attester',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: false },
      {
        name: 'schemaUID',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'Attested',
  },
  { type: 'error', inputs: [], name: 'AccessDenied' },
  { type: 'error', inputs: [], name: 'InsufficientValue' },
  { type: 'error', inputs: [], name: 'InvalidEAS' },
  { type: 'error', inputs: [], name: 'InvalidLength' },
  { type: 'error', inputs: [], name: 'NotPayable' },
] as const

export const easIndexerResolverAddress =
  '0xF0278E089aA3361796e9B9d30C30Ee427747225E' as const

export const easIndexerResolverConfig = {
  address: easIndexerResolverAddress,
  abi: easIndexerResolverAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IWavsServiceManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iWavsServiceManagerAbi = [
  {
    type: 'function',
    inputs: [],
    name: 'getAllocationManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getDelegationManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'signingKeyAddress', internalType: 'address', type: 'address' },
    ],
    name: 'getLatestOperatorForSigningKey',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'getOperatorWeight',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getServiceURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getStakeRegistry',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_serviceURI', internalType: 'string', type: 'string' }],
    name: 'setServiceURI',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'envelope',
        internalType: 'struct IWavsServiceHandler.Envelope',
        type: 'tuple',
        components: [
          { name: 'eventId', internalType: 'bytes20', type: 'bytes20' },
          { name: 'ordering', internalType: 'bytes12', type: 'bytes12' },
          { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'signatureData',
        internalType: 'struct IWavsServiceHandler.SignatureData',
        type: 'tuple',
        components: [
          { name: 'signers', internalType: 'address[]', type: 'address[]' },
          { name: 'signatures', internalType: 'bytes[]', type: 'bytes[]' },
          { name: 'referenceBlock', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'validate',
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'numerator',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'denominator',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'QuorumThresholdUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'serviceURI',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ServiceURIUpdated',
  },
  {
    type: 'error',
    inputs: [
      { name: 'signerWeight', internalType: 'uint256', type: 'uint256' },
      { name: 'thresholdWeight', internalType: 'uint256', type: 'uint256' },
      { name: 'totalWeight', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientQuorum',
  },
  { type: 'error', inputs: [], name: 'InsufficientQuorumZero' },
  { type: 'error', inputs: [], name: 'InvalidQuorumParameters' },
  { type: 'error', inputs: [], name: 'InvalidSignature' },
  { type: 'error', inputs: [], name: 'InvalidSignatureBlock' },
  { type: 'error', inputs: [], name: 'InvalidSignatureLength' },
  { type: 'error', inputs: [], name: 'InvalidSignatureOrder' },
] as const

export const iWavsServiceManagerAddress =
  '0x197484FACcBdb900788f50F553907bbaea20701C' as const

export const iWavsServiceManagerConfig = {
  address: iWavsServiceManagerAddress,
  abi: iWavsServiceManagerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MerkleSnapshot
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const merkleSnapshotAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'serviceManager',
        internalType: 'contract IWavsServiceManager',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ENVELOPE_EXPIRATION_TIME',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'hook',
        internalType: 'contract IMerkleSnapshotHook',
        type: 'address',
      },
    ],
    name: 'addHook',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'blockNumber', internalType: 'uint256', type: 'uint256' }],
    name: 'blockToStateIndex',
    outputs: [{ name: 'stateIndex', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'envelopeExpirationQueue',
    outputs: [{ name: 'eventId', internalType: 'bytes20', type: 'bytes20' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'envelopeExpirationQueueEnd',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'envelopeExpirationQueueSize',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'envelopeExpirationQueueStart',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'eventId', internalType: 'bytes20', type: 'bytes20' }],
    name: 'envelopesSeen',
    outputs: [{ name: 'expiresAt', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getHooks',
    outputs: [
      {
        name: '',
        internalType: 'contract IMerkleSnapshotHook[]',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getLatestState',
    outputs: [
      {
        name: '',
        internalType: 'struct IMerkleSnapshot.MerkleState',
        type: 'tuple',
        components: [
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
          { name: 'totalValue', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getServiceManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'blockNumber', internalType: 'uint256', type: 'uint256' }],
    name: 'getStateAtBlock',
    outputs: [
      {
        name: 'state',
        internalType: 'struct IMerkleSnapshot.MerkleState',
        type: 'tuple',
        components: [
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
          { name: 'totalValue', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'getStateAtIndex',
    outputs: [
      {
        name: 'state',
        internalType: 'struct IMerkleSnapshot.MerkleState',
        type: 'tuple',
        components: [
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
          { name: 'totalValue', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getStateBlocks',
    outputs: [
      { name: 'result_', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getStateCount',
    outputs: [{ name: 'count', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getStates',
    outputs: [
      {
        name: 'result_',
        internalType: 'struct IMerkleSnapshot.MerkleState[]',
        type: 'tuple[]',
        components: [
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
          { name: 'totalValue', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'envelope',
        internalType: 'struct IWavsServiceHandler.Envelope',
        type: 'tuple',
        components: [
          { name: 'eventId', internalType: 'bytes20', type: 'bytes20' },
          { name: 'ordering', internalType: 'bytes12', type: 'bytes12' },
          { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'signatureData',
        internalType: 'struct IWavsServiceHandler.SignatureData',
        type: 'tuple',
        components: [
          { name: 'signers', internalType: 'address[]', type: 'address[]' },
          { name: 'signatures', internalType: 'bytes[]', type: 'bytes[]' },
          { name: 'referenceBlock', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'handleSignedEnvelope',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'hookCount',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'hook',
        internalType: 'contract IMerkleSnapshotHook',
        type: 'address',
      },
    ],
    name: 'hookIndex',
    outputs: [{ name: 'hookIndex', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'hookIndex', internalType: 'uint256', type: 'uint256' }],
    name: 'hooks',
    outputs: [
      {
        name: 'hook',
        internalType: 'contract IMerkleSnapshotHook',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'lastCronTimestampSeen',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextHookIndex',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextTriggerId',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'hook',
        internalType: 'contract IMerkleSnapshotHook',
        type: 'address',
      },
    ],
    name: 'removeHook',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'stateBlocks',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'stateIndex', internalType: 'uint256', type: 'uint256' }],
    name: 'states',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
      { name: 'root', internalType: 'bytes32', type: 'bytes32' },
      { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
      { name: 'totalValue', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'trigger',
    outputs: [{ name: 'triggerId', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'verifyMyProof',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifyMyProofAtBlock',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'stateIndex', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifyMyProofAtStateIndex',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'verifyProof',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifyProofAtBlock',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'stateIndex', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifyProofAtStateIndex',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'root', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'ipfsHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'ipfsHashCid',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'totalValue',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MerkleRootUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'triggerId',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'MerklerTrigger',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_triggerInfo',
        internalType: 'bytes',
        type: 'bytes',
        indexed: false,
      },
    ],
    name: 'NewTrigger',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'count',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PrunedExpiredEnvelopes',
  },
  { type: 'error', inputs: [], name: 'EnvelopeAlreadySeen' },
  { type: 'error', inputs: [], name: 'EnvelopeExpired' },
  { type: 'error', inputs: [], name: 'HookAlreadyAdded' },
  { type: 'error', inputs: [], name: 'HookNotAdded' },
  {
    type: 'error',
    inputs: [
      { name: 'requested', internalType: 'uint256', type: 'uint256' },
      { name: 'firstBlock', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'NoMerkleStateAtBlock',
  },
  {
    type: 'error',
    inputs: [
      { name: 'requested', internalType: 'uint256', type: 'uint256' },
      { name: 'total', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'NoMerkleStateAtIndex',
  },
  { type: 'error', inputs: [], name: 'NoMerkleStates' },
] as const

export const merkleSnapshotAddress =
  '0x6d5339Fd17235803AE68e04d0b820bdd987427AC' as const

export const merkleSnapshotConfig = {
  address: merkleSnapshotAddress,
  abi: merkleSnapshotAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SchemaRegistrar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const schemaRegistrarAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'schemaRegistry',
        internalType: 'contract ISchemaRegistry',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schema', internalType: 'string', type: 'string' },
      {
        name: 'resolver',
        internalType: 'contract ISchemaResolver',
        type: 'address',
      },
      { name: 'revocable', internalType: 'bool', type: 'bool' },
    ],
    name: 'register',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'InvalidResolver' },
  { type: 'error', inputs: [], name: 'InvalidSchema' },
  { type: 'error', inputs: [], name: 'InvalidSchemaRegistry' },
] as const

export const schemaRegistrarAddress =
  '0x33b9885aC3cB1891b0bC43F55D71963BD1Fee5F2' as const

export const schemaRegistrarConfig = {
  address: schemaRegistrarAddress,
  abi: schemaRegistrarAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SchemaRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const schemaRegistryAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'uid', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getSchema',
    outputs: [
      {
        name: '',
        internalType: 'struct SchemaRecord',
        type: 'tuple',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'resolver',
            internalType: 'contract ISchemaResolver',
            type: 'address',
          },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'schema', internalType: 'string', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schema', internalType: 'string', type: 'string' },
      {
        name: 'resolver',
        internalType: 'contract ISchemaResolver',
        type: 'address',
      },
      { name: 'revocable', internalType: 'bool', type: 'bool' },
    ],
    name: 'register',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'registerer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'schema',
        internalType: 'struct SchemaRecord',
        type: 'tuple',
        components: [
          { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'resolver',
            internalType: 'contract ISchemaResolver',
            type: 'address',
          },
          { name: 'revocable', internalType: 'bool', type: 'bool' },
          { name: 'schema', internalType: 'string', type: 'string' },
        ],
        indexed: false,
      },
    ],
    name: 'Registered',
  },
  { type: 'error', inputs: [], name: 'AlreadyExists' },
] as const

export const schemaRegistryAddress =
  '0x4200000000000000000000000000000000000020' as const

export const schemaRegistryConfig = {
  address: schemaRegistryAddress,
  abi: schemaRegistryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WavsAttester
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const wavsAttesterAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'eas', internalType: 'contract IEAS', type: 'address' },
      {
        name: 'serviceManager',
        internalType: 'contract IWavsServiceManager',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes', type: 'bytes' }],
    name: 'decodeAttestData',
    outputs: [
      {
        name: '',
        internalType: 'struct AttestationRequest',
        type: 'tuple',
        components: [
          { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'data',
            internalType: 'struct AttestationRequestData',
            type: 'tuple',
            components: [
              { name: 'recipient', internalType: 'address', type: 'address' },
              {
                name: 'expirationTime',
                internalType: 'uint64',
                type: 'uint64',
              },
              { name: 'revocable', internalType: 'bool', type: 'bool' },
              { name: 'refUID', internalType: 'bytes32', type: 'bytes32' },
              { name: 'data', internalType: 'bytes', type: 'bytes' },
              { name: 'value', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'payload', internalType: 'bytes', type: 'bytes' }],
    name: 'decodeAttestationPayload',
    outputs: [
      {
        name: '',
        internalType: 'struct WavsAttester.AttestationPayload',
        type: 'tuple',
        components: [
          {
            name: 'operationType',
            internalType: 'enum WavsAttester.OperationType',
            type: 'uint8',
          },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'eventId', internalType: 'bytes20', type: 'bytes20' }],
    name: 'envelopesSeen',
    outputs: [{ name: 'seen', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getServiceManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'envelope',
        internalType: 'struct IWavsServiceHandler.Envelope',
        type: 'tuple',
        components: [
          { name: 'eventId', internalType: 'bytes20', type: 'bytes20' },
          { name: 'ordering', internalType: 'bytes12', type: 'bytes12' },
          { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'signatureData',
        internalType: 'struct IWavsServiceHandler.SignatureData',
        type: 'tuple',
        components: [
          { name: 'signers', internalType: 'address[]', type: 'address[]' },
          { name: 'signatures', internalType: 'bytes[]', type: 'bytes[]' },
          { name: 'referenceBlock', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'handleSignedEnvelope',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'schema',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'dataLength',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DebuggingAttestCalled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'payload', internalType: 'bytes', type: 'bytes', indexed: false },
      {
        name: 'payloadLength',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DebuggingEnvelopeReceived',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operationType',
        internalType: 'uint8',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'dataLength',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DebuggingPayloadDecoded',
  },
  { type: 'error', inputs: [], name: 'DataDecodingFailed' },
  { type: 'error', inputs: [], name: 'EnvelopeAlreadySeen' },
  { type: 'error', inputs: [], name: 'InvalidEAS' },
  { type: 'error', inputs: [], name: 'InvalidInput' },
  { type: 'error', inputs: [], name: 'InvalidOperationType' },
  { type: 'error', inputs: [], name: 'InvalidServiceManager' },
  { type: 'error', inputs: [], name: 'PayloadDecodingFailed' },
] as const

export const wavsAttesterAddress =
  '0xbaF18D8045521a6d91243BBB2CaaFb37a35d70F4' as const

export const wavsAttesterConfig = {
  address: wavsAttesterAddress,
  abi: wavsAttesterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WavsIndexer
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const wavsIndexerAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'serviceManager',
        internalType: 'contract IWavsServiceManager',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'payload', internalType: 'bytes', type: 'bytes' }],
    name: 'decodeIndexingPayload',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexingPayload',
        type: 'tuple',
        components: [
          {
            name: 'toAdd',
            internalType: 'struct IWavsIndexer.IndexedEvent[]',
            type: 'tuple[]',
            components: [
              { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
              { name: 'chainId', internalType: 'string', type: 'string' },
              {
                name: 'relevantContract',
                internalType: 'address',
                type: 'address',
              },
              { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
              { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
              { name: 'eventType', internalType: 'string', type: 'string' },
              { name: 'data', internalType: 'bytes', type: 'bytes' },
              { name: 'tags', internalType: 'string[]', type: 'string[]' },
              {
                name: 'relevantAddresses',
                internalType: 'address[]',
                type: 'address[]',
              },
              { name: 'metadata', internalType: 'bytes', type: 'bytes' },
              { name: 'deleted', internalType: 'bool', type: 'bool' },
            ],
          },
          { name: 'toDelete', internalType: 'bytes32[]', type: 'bytes32[]' },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'eventExists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'eventId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'eventExistsAndDeleted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'events',
    outputs: [
      { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'relevantContract', internalType: 'address', type: 'address' },
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'metadata', internalType: 'bytes', type: 'bytes' },
      { name: 'deleted', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByAddress',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByAddressAndTag',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByAddressAndType',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByAddressAndTypeAndTag',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByChainId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByChainIdAndContract',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByChainIdAndContractAndAddress',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByChainIdAndContractAndTag',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByChainIdAndContractAndType',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByChainIdAndContractAndTypeAndTag',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByTag',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByType',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'string', type: 'string' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'eventsByTypeAndTag',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'eventId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getEvent',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent',
        type: 'tuple',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'getEventCountByAddress',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'tag', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByAddressAndTag',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByAddressAndType',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'tag', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByAddressAndTypeAndTag',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'chainId', internalType: 'string', type: 'string' }],
    name: 'getEventCountByChainId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
    ],
    name: 'getEventCountByContract',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'getEventCountByContractAndAddress',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'tag', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByContractAndTag',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByContractAndType',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'tag', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByContractAndTypeAndTag',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tag', internalType: 'string', type: 'string' }],
    name: 'getEventCountByTag',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'eventType', internalType: 'string', type: 'string' }],
    name: 'getEventCountByType',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'tag', internalType: 'string', type: 'string' },
    ],
    name: 'getEventCountByTypeAndTag',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByAddress',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'tag', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByAddressAndTag',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByAddressAndType',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'tag', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByAddressAndTypeAndTag',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByChainId',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByContract',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'addr', internalType: 'address', type: 'address' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByContractAndAddress',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'tag', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByContractAndTag',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByContractAndType',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'chainId', internalType: 'string', type: 'string' },
      { name: 'contract_', internalType: 'address', type: 'address' },
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'tag', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByContractAndTypeAndTag',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tag', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByTag',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByType',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'eventType', internalType: 'string', type: 'string' },
      { name: 'tag', internalType: 'string', type: 'string' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getEventsByTypeAndTag',
    outputs: [
      {
        name: '',
        internalType: 'struct IWavsIndexer.IndexedEvent[]',
        type: 'tuple[]',
        components: [
          { name: 'eventId', internalType: 'bytes32', type: 'bytes32' },
          { name: 'chainId', internalType: 'string', type: 'string' },
          {
            name: 'relevantContract',
            internalType: 'address',
            type: 'address',
          },
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'timestamp', internalType: 'uint128', type: 'uint128' },
          { name: 'eventType', internalType: 'string', type: 'string' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'tags', internalType: 'string[]', type: 'string[]' },
          {
            name: 'relevantAddresses',
            internalType: 'address[]',
            type: 'address[]',
          },
          { name: 'metadata', internalType: 'bytes', type: 'bytes' },
          { name: 'deleted', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getServiceManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'envelope',
        internalType: 'struct IWavsServiceHandler.Envelope',
        type: 'tuple',
        components: [
          { name: 'eventId', internalType: 'bytes20', type: 'bytes20' },
          { name: 'ordering', internalType: 'bytes12', type: 'bytes12' },
          { name: 'payload', internalType: 'bytes', type: 'bytes' },
        ],
      },
      {
        name: 'signatureData',
        internalType: 'struct IWavsServiceHandler.SignatureData',
        type: 'tuple',
        components: [
          { name: 'signers', internalType: 'address[]', type: 'address[]' },
          { name: 'signatures', internalType: 'bytes[]', type: 'bytes[]' },
          { name: 'referenceBlock', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
    name: 'handleSignedEnvelope',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalEvents',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'version',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'eventId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'EventDeleted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'eventId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'relevantContract',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'eventType',
        internalType: 'string',
        type: 'string',
        indexed: true,
      },
      {
        name: 'relevantAddresses',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'tags',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
    ],
    name: 'EventIndexed',
  },
  { type: 'error', inputs: [], name: 'CannotCreateDeletedEvent' },
  { type: 'error', inputs: [], name: 'EventAlreadyDeleted' },
  { type: 'error', inputs: [], name: 'EventAlreadyExists' },
  { type: 'error', inputs: [], name: 'EventDoesNotExist' },
  { type: 'error', inputs: [], name: 'ExpectedEventIdZero' },
  { type: 'error', inputs: [], name: 'InvalidOffset' },
  { type: 'error', inputs: [], name: 'InvalidServiceManager' },
  { type: 'error', inputs: [], name: 'NoEvents' },
  { type: 'error', inputs: [], name: 'PayloadDecodingFailed' },
] as const

export const wavsIndexerAddress =
  '0xF56904778BcCF9B89c4B2f214eB07Fb2B9872b5E' as const

export const wavsIndexerConfig = {
  address: wavsIndexerAddress,
  abi: wavsIndexerAbi,
} as const
