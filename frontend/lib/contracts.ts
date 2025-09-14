//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ConditionalTokens
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const conditionalTokensAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'uri_', internalType: 'string', type: 'string' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'accounts', internalType: 'address[]', type: 'address[]' },
      { name: 'ids', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSet', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getCollectionId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'oracle', internalType: 'address', type: 'address' },
      { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'outcomeSlotCount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getConditionId',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'conditionId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getOutcomeSlotCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'collectionId', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getPositionId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'partition', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mergePositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'payoutDenominator',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'bytes32', type: 'bytes32' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'payoutNumerators',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'oracle', internalType: 'address', type: 'address' },
      { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'outcomeSlotCount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'prepareCondition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'indexSets', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'redeemPositions',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'payouts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'reportPayouts',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'ids', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeBatchTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: 'parentCollectionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'conditionId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'partition', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'splitPosition',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'oracle',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'questionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'outcomeSlotCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ConditionPreparation',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'oracle',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'questionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'outcomeSlotCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'payoutNumerators',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
    ],
    name: 'ConditionResolution',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'interactionType',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'tags',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'Interaction',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'redeemer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: true,
      },
      {
        name: 'parentCollectionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'indexSets',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'payout',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PayoutRedemption',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'stakeholder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
      {
        name: 'parentCollectionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'partition',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PositionSplit',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'stakeholder',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
      {
        name: 'parentCollectionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'conditionId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'partition',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PositionsMerge',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'ids',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
    ],
    name: 'TransferBatch',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TransferSingle',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'value', internalType: 'string', type: 'string', indexed: false },
      { name: 'id', internalType: 'uint256', type: 'uint256', indexed: true },
    ],
    name: 'URI',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1155InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidApprover',
  },
  {
    type: 'error',
    inputs: [
      { name: 'idsLength', internalType: 'uint256', type: 'uint256' },
      { name: 'valuesLength', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1155InvalidArrayLength',
  },
  {
    type: 'error',
    inputs: [{ name: 'operator', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidOperator',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC1155InvalidSender',
  },
  {
    type: 'error',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC1155MissingApprovalForAll',
  },
  {
    type: 'error',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'StringsInsufficientHexLength',
  },
] as const

export const conditionalTokensAddress =
  '0xB84b0E1FdDC347E10123ea2158B127BFB58fa06F' as const

export const conditionalTokensConfig = {
  address: conditionalTokensAddress,
  abi: conditionalTokensAbi,
} as const

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

export const easAddress = '0xBc529F023B23312c156d886b7Dd5e0668f2809a9' as const

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
  '0x7CC9F77370B1abbF01398C9618249649c076F28b' as const

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
  '0x01Df147fb8C2981ffEaA272308d77972D0F0fD22' as const

export const easIndexerResolverConfig = {
  address: easIndexerResolverAddress,
  abi: easIndexerResolverAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ENOVA
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const enovaAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'defaultAdmin', internalType: 'address', type: 'address' },
      { name: 'tokenBridge', internalType: 'address', type: 'address' },
      { name: 'pauser', internalType: 'address', type: 'address' },
      { name: 'minter', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'CLOCK_MODE',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MINTER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PAUSER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'TOKEN_BRIDGE_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approveAndCall',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'approveAndCall',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'value', internalType: 'uint256', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burnFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'pos', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'checkpoints',
    outputs: [
      {
        name: '',
        internalType: 'struct Checkpoints.Checkpoint208',
        type: 'tuple',
        components: [
          { name: '_key', internalType: 'uint48', type: 'uint48' },
          { name: '_value', internalType: 'uint208', type: 'uint208' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'clock',
    outputs: [{ name: '', internalType: 'uint48', type: 'uint48' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'delegatee', internalType: 'address', type: 'address' }],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'delegatee', internalType: 'address', type: 'address' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'expiry', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'delegateBySig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'delegates',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
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
    inputs: [{ name: 'timepoint', internalType: 'uint256', type: 'uint256' }],
    name: 'getPastTotalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getPastVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'numCheckpoints',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferAndCall',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'transferAndCall',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'transferFromAndCall',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFromAndCall',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'fromDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'toDelegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'DelegateChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'delegate',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'previousVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotes',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DelegateVotesChanged',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Paused',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Unpaused',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'CheckpointUnorderedInsertion' },
  { type: 'error', inputs: [], name: 'ECDSAInvalidSignature' },
  {
    type: 'error',
    inputs: [{ name: 'length', internalType: 'uint256', type: 'uint256' }],
    name: 'ECDSAInvalidSignatureLength',
  },
  {
    type: 'error',
    inputs: [{ name: 's', internalType: 'bytes32', type: 'bytes32' }],
    name: 'ECDSAInvalidSignatureS',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1363ApproveFailed',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC1363InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC1363InvalidSpender',
  },
  {
    type: 'error',
    inputs: [
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1363TransferFailed',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'receiver', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC1363TransferFromFailed',
  },
  {
    type: 'error',
    inputs: [
      { name: 'increasedSupply', internalType: 'uint256', type: 'uint256' },
      { name: 'cap', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20ExceededSafeSupply',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [{ name: 'deadline', internalType: 'uint256', type: 'uint256' }],
    name: 'ERC2612ExpiredSignature',
  },
  {
    type: 'error',
    inputs: [
      { name: 'signer', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
    ],
    name: 'ERC2612InvalidSigner',
  },
  {
    type: 'error',
    inputs: [
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
      { name: 'clock', internalType: 'uint48', type: 'uint48' },
    ],
    name: 'ERC5805FutureLookup',
  },
  { type: 'error', inputs: [], name: 'ERC6372InconsistentClock' },
  { type: 'error', inputs: [], name: 'EnforcedPause' },
  { type: 'error', inputs: [], name: 'ExpectedPause' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'currentNonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InvalidAccountNonce',
  },
  { type: 'error', inputs: [], name: 'InvalidShortString' },
  {
    type: 'error',
    inputs: [
      { name: 'bits', internalType: 'uint8', type: 'uint8' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'SafeCastOverflowedUintDowncast',
  },
  {
    type: 'error',
    inputs: [{ name: 'str', internalType: 'string', type: 'string' }],
    name: 'StringTooLong',
  },
  { type: 'error', inputs: [], name: 'Unauthorized' },
  {
    type: 'error',
    inputs: [{ name: 'expiry', internalType: 'uint256', type: 'uint256' }],
    name: 'VotesExpiredSignature',
  },
] as const

export const enovaAddress =
  '0x4D87e9B182E45dcEbB8e85c80e9DadE644151147' as const

export const enovaConfig = { address: enovaAddress, abi: enovaAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GnosisSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const gnosisSafeAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'fallback', stateMutability: 'nonpayable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addOwnerWithThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'hashToApprove', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'approveHash',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'approvedHashes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_threshold', internalType: 'uint256', type: 'uint256' }],
    name: 'changeThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
      { name: 'requiredSignatures', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'checkNSignatures',
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'checkSignatures',
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevModule', internalType: 'address', type: 'address' },
      { name: 'module', internalType: 'address', type: 'address' },
    ],
    name: 'disableModule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'domainSeparator',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    name: 'enableModule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address', type: 'address' },
      { name: '_nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'encodeTransactionData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      {
        name: 'refundReceiver',
        internalType: 'address payable',
        type: 'address',
      },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'execTransaction',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionFromModule',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionFromModuleReturnData',
    outputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'returnData', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getChainId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'address', type: 'address' },
      { name: 'pageSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getModulesPaginated',
    outputs: [
      { name: 'array', internalType: 'address[]', type: 'address[]' },
      { name: 'next', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getOwners',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getStorageAt',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address', type: 'address' },
      { name: '_nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTransactionHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    name: 'isModuleEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'isOwner',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'requiredTxGas',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'handler', internalType: 'address', type: 'address' }],
    name: 'setFallbackHandler',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'guard', internalType: 'address', type: 'address' }],
    name: 'setGuard',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_owners', internalType: 'address[]', type: 'address[]' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'fallbackHandler', internalType: 'address', type: 'address' },
      { name: 'paymentToken', internalType: 'address', type: 'address' },
      { name: 'payment', internalType: 'uint256', type: 'uint256' },
      {
        name: 'paymentReceiver',
        internalType: 'address payable',
        type: 'address',
      },
    ],
    name: 'setup',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'signedMessages',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targetContract', internalType: 'address', type: 'address' },
      { name: 'calldataPayload', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'oldOwner', internalType: 'address', type: 'address' },
      { name: 'newOwner', internalType: 'address', type: 'address' },
    ],
    name: 'swapOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'AddedOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'approvedHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ApproveHash',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'handler',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'ChangedFallbackHandler',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'guard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'ChangedGuard',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'threshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ChangedThreshold',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'DisabledModule',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'EnabledModule',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'txHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'payment',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ExecutionFailure',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExecutionFromModuleFailure',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExecutionFromModuleSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'txHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'payment',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ExecutionSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'RemovedOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SafeReceived',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'initiator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'owners',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'threshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'initializer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'fallbackHandler',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'SafeSetup',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'msgHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'SignMsg',
  },
] as const

export const gnosisSafeAddress =
  '0x7391755720A71D8ef3cf443238B3F92EB6965E01' as const

export const gnosisSafeConfig = {
  address: gnosisSafeAddress,
  abi: gnosisSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GnosisSafeProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const gnosisSafeProxyAbi = [
  {
    type: 'constructor',
    inputs: [{ name: '_singleton', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
] as const

export const gnosisSafeProxyAddress =
  '0x767f173CEb7277691A45285fC7E230f328C1baa9' as const

export const gnosisSafeProxyConfig = {
  address: gnosisSafeProxyAddress,
  abi: gnosisSafeProxyAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LMSRMarketMaker
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const lmsrMarketMakerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'initialOwner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'FEE_RANGE',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'atomicOutcomeSlotCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'outcomeTokenIndex', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'calcMarginalPrice',
    outputs: [{ name: 'price', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'outcomeTokenCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'calcMarketFee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'outcomeTokenAmounts',
        internalType: 'int256[]',
        type: 'int256[]',
      },
    ],
    name: 'calcNetCost',
    outputs: [{ name: 'netCost', internalType: 'int256', type: 'int256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_fee', internalType: 'uint64', type: 'uint64' }],
    name: 'changeFee',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'fundingChange', internalType: 'int256', type: 'int256' }],
    name: 'changeFunding',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'close',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'collateralToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'conditionIds',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fee',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'funding',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_pmSystem',
        internalType: 'contract ConditionalTokens',
        type: 'address',
      },
      {
        name: '_collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
      },
      { name: '_conditionIds', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: '_fee', internalType: 'uint64', type: 'uint64' },
      {
        name: '_whitelist',
        internalType: 'contract Whitelist',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_operator', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pmSystem',
    outputs: [
      { name: '', internalType: 'contract ConditionalTokens', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'resume',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'stage',
    outputs: [
      { name: '', internalType: 'enum MarketMaker.Stage', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'outcomeTokenAmounts',
        internalType: 'int256[]',
        type: 'int256[]',
      },
      { name: 'collateralLimit', internalType: 'int256', type: 'int256' },
    ],
    name: 'trade',
    outputs: [{ name: 'netCost', internalType: 'int256', type: 'int256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'whitelist',
    outputs: [
      { name: '', internalType: 'contract Whitelist', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdrawFees',
    outputs: [{ name: 'fees', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'AMMClosed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'initialFunding',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AMMCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newFee',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'AMMFeeChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'fees',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AMMFeeWithdrawal',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'fundingChange',
        internalType: 'int256',
        type: 'int256',
        indexed: false,
      },
    ],
    name: 'AMMFundingChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'transactor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'outcomeTokenAmounts',
        internalType: 'int256[]',
        type: 'int256[]',
        indexed: false,
      },
      {
        name: 'outcomeTokenNetCost',
        internalType: 'int256',
        type: 'int256',
        indexed: false,
      },
      {
        name: 'marketFees',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AMMOutcomeTokenTrade',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'AMMPaused' },
  { type: 'event', anonymous: false, inputs: [], name: 'AMMResumed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'interactionType',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'tags',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'Interaction',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'StringsInsufficientHexLength',
  },
] as const

export const lmsrMarketMakerAddress =
  '0xd486Cd623f9C4c1E6e88F5A1999B05EE3604DCcc' as const

export const lmsrMarketMakerConfig = {
  address: lmsrMarketMakerAddress,
  abi: lmsrMarketMakerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MarketMaker
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const marketMakerAbi = [
  {
    type: 'function',
    inputs: [],
    name: 'FEE_RANGE',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'atomicOutcomeSlotCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'outcomeTokenCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'calcMarketFee',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'outcomeTokenAmounts',
        internalType: 'int256[]',
        type: 'int256[]',
      },
    ],
    name: 'calcNetCost',
    outputs: [{ name: 'netCost', internalType: 'int256', type: 'int256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_fee', internalType: 'uint64', type: 'uint64' }],
    name: 'changeFee',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'fundingChange', internalType: 'int256', type: 'int256' }],
    name: 'changeFunding',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'close',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'collateralToken',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'conditionIds',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'fee',
    outputs: [{ name: '', internalType: 'uint64', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'funding',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_operator', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pmSystem',
    outputs: [
      { name: '', internalType: 'contract ConditionalTokens', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'resume',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'stage',
    outputs: [
      { name: '', internalType: 'enum MarketMaker.Stage', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'outcomeTokenAmounts',
        internalType: 'int256[]',
        type: 'int256[]',
      },
      { name: 'collateralLimit', internalType: 'int256', type: 'int256' },
    ],
    name: 'trade',
    outputs: [{ name: 'netCost', internalType: 'int256', type: 'int256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'whitelist',
    outputs: [
      { name: '', internalType: 'contract Whitelist', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'withdrawFees',
    outputs: [{ name: 'fees', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'AMMClosed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'initialFunding',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AMMCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newFee',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'AMMFeeChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'fees',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AMMFeeWithdrawal',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'fundingChange',
        internalType: 'int256',
        type: 'int256',
        indexed: false,
      },
    ],
    name: 'AMMFundingChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'transactor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'outcomeTokenAmounts',
        internalType: 'int256[]',
        type: 'int256[]',
        indexed: false,
      },
      {
        name: 'outcomeTokenNetCost',
        internalType: 'int256',
        type: 'int256',
        indexed: false,
      },
      {
        name: 'marketFees',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AMMOutcomeTokenTrade',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'AMMPaused' },
  { type: 'event', anonymous: false, inputs: [], name: 'AMMResumed' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'interactionType',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'tags',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      { name: 'data', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'Interaction',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'StringsInsufficientHexLength',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MerkleGovModule
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const merkleGovModuleAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_avatar', internalType: 'address', type: 'address' },
      { name: '_target', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'avatar',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'cancel',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      {
        name: 'voteType',
        internalType: 'enum MerkleGovModule.VoteType',
        type: 'uint8',
      },
      { name: 'votingPower', internalType: 'uint256', type: 'uint256' },
      { name: 'rewardToken', internalType: 'address', type: 'address' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'castVote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'currentMerkleRoot',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'getActions',
    outputs: [
      {
        name: '',
        internalType: 'struct MerkleGovModule.ProposalAction[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
          { name: 'operation', internalType: 'enum Operation', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasVoted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ipfsHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ipfsHashCid',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'state_',
        internalType: 'struct IMerkleSnapshot.MerkleState',
        type: 'tuple',
        components: [
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
        ],
      },
    ],
    name: 'onMerkleUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'proposalActions',
    outputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Operation', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { name: 'id', internalType: 'uint256', type: 'uint256' },
      { name: 'proposer', internalType: 'address', type: 'address' },
      { name: 'startBlock', internalType: 'uint256', type: 'uint256' },
      { name: 'endBlock', internalType: 'uint256', type: 'uint256' },
      { name: 'forVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'againstVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'abstainVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'executed', internalType: 'bool', type: 'bool' },
      { name: 'cancelled', internalType: 'bool', type: 'bool' },
      { name: 'merkleRoot', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'operations', internalType: 'enum Operation[]', type: 'uint8[]' },
      { name: 'description', internalType: 'string', type: 'string' },
    ],
    name: 'propose',
    outputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'quorum',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_avatar', internalType: 'address', type: 'address' }],
    name: 'setAvatar',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newQuorum', internalType: 'uint256', type: 'uint256' }],
    name: 'setQuorum',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_target', internalType: 'address', type: 'address' }],
    name: 'setTarget',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'initializeParams', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'setUp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newDelay', internalType: 'uint256', type: 'uint256' }],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newPeriod', internalType: 'uint256', type: 'uint256' }],
    name: 'setVotingPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'state',
    outputs: [
      {
        name: '',
        internalType: 'enum MerkleGovModule.ProposalState',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'target',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'votingDelay',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'votingPeriod',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAvatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAvatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'AvatarSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
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
    ],
    name: 'MerkleRootUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ProposalCancelled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'startBlock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'endBlock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'merkleRoot',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'ProposalCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ProposalExecuted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newQuorum',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'QuorumUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousTarget',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newTarget',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'TargetSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'voteType',
        internalType: 'enum MerkleGovModule.VoteType',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'votingPower',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VoteCast',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newDelay',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotingDelayUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newPeriod',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotingPeriodUpdated',
  },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
] as const

export const merkleGovModuleAddress =
  '0x51092fb53317cFC2310dEB51b0F2b347Db6E0E19' as const

export const merkleGovModuleConfig = {
  address: merkleGovModuleAddress,
  abi: merkleGovModuleAbi,
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
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
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
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
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
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
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
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
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
      { name: 'root', internalType: 'bytes32', type: 'bytes32' },
      { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
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
  { type: 'error', inputs: [], name: 'HookAlreadyAdded' },
  { type: 'error', inputs: [], name: 'HookNotAdded' },
  {
    type: 'error',
    inputs: [
      { name: 'given', internalType: 'uint64', type: 'uint64' },
      { name: 'last', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'InvalidCronTimestamp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'actual', internalType: 'uint64', type: 'uint64' },
      { name: 'expected', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'InvalidTriggerId',
  },
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
  '0x04C0F57e805E8098F1b97177e90c0621393A5395' as const

export const merkleSnapshotConfig = {
  address: merkleSnapshotAddress,
  abi: merkleSnapshotAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MockUSDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const mockUsdcAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
] as const

export const mockUsdcAddress =
  '0xC8D27E636F7A94B7044C486Db0619f6f39887604' as const

export const mockUsdcConfig = {
  address: mockUsdcAddress,
  abi: mockUsdcAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PredictionMarketFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const predictionMarketFactoryAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'uri', internalType: 'string', type: 'string' },
      { name: 'questionId', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'collateralTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'fee', internalType: 'uint64', type: 'uint64' },
      { name: 'funding', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createConditionalTokenAndLMSRMarketMaker',
    outputs: [
      {
        name: 'conditionalTokens',
        internalType: 'contract ConditionalTokens',
        type: 'address',
      },
      {
        name: 'lmsrMarketMaker',
        internalType: 'contract LMSRMarketMaker',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementationMaster',
    outputs: [
      { name: '', internalType: 'contract LMSRMarketMaker', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'oracle',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'lmsrMarketMaker',
        internalType: 'contract LMSRMarketMaker',
        type: 'address',
      },
      {
        name: 'conditionalTokens',
        internalType: 'contract ConditionalTokens',
        type: 'address',
      },
      { name: 'result', internalType: 'bool', type: 'bool' },
    ],
    name: 'resolveMarket',
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
        name: 'lmsrMarketMaker',
        internalType: 'contract LMSRMarketMaker',
        type: 'address',
        indexed: false,
      },
      {
        name: 'pmSystem',
        internalType: 'contract ConditionalTokens',
        type: 'address',
        indexed: false,
      },
      {
        name: 'collateralToken',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
      {
        name: 'conditionIds',
        internalType: 'bytes32[]',
        type: 'bytes32[]',
        indexed: false,
      },
      { name: 'fee', internalType: 'uint64', type: 'uint64', indexed: false },
      {
        name: 'funding',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LMSRMarketMakerCreation',
  },
  { type: 'error', inputs: [], name: 'FailedDeployment' },
  {
    type: 'error',
    inputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'InsufficientBalance',
  },
] as const

export const predictionMarketFactoryAddress =
  '0x785ef2aD4F047730A71b2c81c541eF8A14a96F51' as const

export const predictionMarketFactoryConfig = {
  address: predictionMarketFactoryAddress,
  abi: predictionMarketFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PredictionMarketOracleController
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const predictionMarketOracleControllerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'serviceManager_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'addTrigger',
    outputs: [
      { name: 'triggerId', internalType: 'ITypes.TriggerId', type: 'uint64' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'factory',
    outputs: [
      {
        name: '',
        internalType: 'contract PredictionMarketFactory',
        type: 'address',
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
      { name: 'triggerId', internalType: 'ITypes.TriggerId', type: 'uint64' },
    ],
    name: 'getTrigger',
    outputs: [
      {
        name: '_triggerInfo',
        internalType: 'struct ITypes.TriggerInfo',
        type: 'tuple',
        components: [
          {
            name: 'triggerId',
            internalType: 'ITypes.TriggerId',
            type: 'uint64',
          },
          { name: 'creator', internalType: 'address', type: 'address' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
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
    name: 'nextTriggerId',
    outputs: [{ name: '', internalType: 'ITypes.TriggerId', type: 'uint64' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'serviceManager',
    outputs: [
      {
        name: '',
        internalType: 'contract IWavsServiceManager',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_creator', internalType: 'address', type: 'address' }],
    name: 'triggerIdsByCreator',
    outputs: [
      {
        name: '_triggerIds',
        internalType: 'ITypes.TriggerId[]',
        type: 'uint64[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_triggerId', internalType: 'ITypes.TriggerId', type: 'uint64' },
    ],
    name: 'triggersById',
    outputs: [
      { name: 'creator', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'view',
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
] as const

export const predictionMarketOracleControllerAddress =
  '0x1675c6dede3D381E4cA63dCF7Da43205A07f23ff' as const

export const predictionMarketOracleControllerConfig = {
  address: predictionMarketOracleControllerAddress,
  abi: predictionMarketOracleControllerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RewardDistributor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const rewardDistributorAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'rewardToken_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'acceptRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'claimable', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'claim',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'reward', internalType: 'address', type: 'address' },
      { name: 'claimable', internalType: 'uint256', type: 'uint256' },
      { name: 'proof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'claim',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'reward', internalType: 'address', type: 'address' },
    ],
    name: 'claimed',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ipfsHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ipfsHashCid',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isUpdater',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'state',
        internalType: 'struct IMerkleSnapshot.MerkleState',
        type: 'tuple',
        components: [
          { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
          { name: 'root', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'ipfsHashCid', internalType: 'string', type: 'string' },
        ],
      },
    ],
    name: 'onMerkleUpdate',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pendingRoot',
    outputs: [
      { name: 'root', internalType: 'bytes32', type: 'bytes32' },
      { name: 'ipfsHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'validAt', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'revokePendingRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardToken',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'root',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'setOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newRoot', internalType: 'bytes32', type: 'bytes32' },
      { name: 'newIpfsHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'setRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'updater', internalType: 'address', type: 'address' },
      { name: 'active', internalType: 'bool', type: 'bool' },
    ],
    name: 'setRootUpdater',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newTimelock', internalType: 'uint256', type: 'uint256' }],
    name: 'setTimelock',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newRoot', internalType: 'bytes32', type: 'bytes32' },
      { name: 'newIpfsHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'submitRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'timelock',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'reward',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Claimed',
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
    ],
    name: 'MerkleRootUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnerSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'caller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'PendingRootRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'caller',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newRoot',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newIpfsHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'PendingRootSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newRoot',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newIpfsHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RootSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'rootUpdater',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'active', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'RootUpdaterSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newTimelock',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TimelockSet',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
] as const

export const rewardDistributorAddress =
  '0x745b5550f39c76d3983f5f98CDfF4022CFeBF689' as const

export const rewardDistributorConfig = {
  address: rewardDistributorAddress,
  abi: rewardDistributorAbi,
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
  '0x75dDe7fb0525373ed7c68aD036fd8fE85128cD62' as const

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
  '0x08eD52Ada6cb08E9BB2f110E7C454CCBC7254463' as const

export const schemaRegistryConfig = {
  address: schemaRegistryAddress,
  abi: schemaRegistryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SignerManagerModule
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const signerManagerModuleAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_avatar', internalType: 'address', type: 'address' },
      { name: '_target', internalType: 'address', type: 'address' },
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
    inputs: [
      { name: 'signer', internalType: 'address', type: 'address' },
      { name: 'newThreshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addSigner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'avatar',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newThreshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'changeThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Operation', type: 'uint8' },
    ],
    name: 'executeTransaction',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
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
    inputs: [],
    name: 'getSigners',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
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
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevSigner', internalType: 'address', type: 'address' },
      { name: 'signer', internalType: 'address', type: 'address' },
      { name: 'newThreshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeSigner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_avatar', internalType: 'address', type: 'address' }],
    name: 'setAvatar',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_target', internalType: 'address', type: 'address' }],
    name: 'setTarget',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'initializeParams', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'setUp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_avatar', internalType: 'address', type: 'address' },
      { name: '_target', internalType: 'address', type: 'address' },
    ],
    name: 'setUpModule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'prevSigner', internalType: 'address', type: 'address' },
      { name: 'oldSigner', internalType: 'address', type: 'address' },
      { name: 'newSigner', internalType: 'address', type: 'address' },
    ],
    name: 'swapSigner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'target',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousAvatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAvatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'AvatarSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'version',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'avatar',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'target',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ModuleConfigured',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'signer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SignerAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'signer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SignerRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldSigner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newSigner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'SignerSwapped',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousTarget',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newTarget',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'TargetSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'newThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ThresholdChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operationType',
        internalType: 'enum SignerManagerModule.OperationType',
        type: 'uint8',
        indexed: true,
      },
      {
        name: 'totalOperations',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WAVSOperationExecuted',
  },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
] as const

export const signerManagerModuleAddress =
  '0x73Db14e5b48e8EE2cE6c754432b164bde45CAE28' as const

export const signerManagerModuleConfig = {
  address: signerManagerModuleAddress,
  abi: signerManagerModuleAbi,
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
  { type: 'error', inputs: [], name: 'InvalidEAS' },
  { type: 'error', inputs: [], name: 'InvalidInput' },
  { type: 'error', inputs: [], name: 'InvalidOperationType' },
  { type: 'error', inputs: [], name: 'InvalidServiceManager' },
  { type: 'error', inputs: [], name: 'PayloadDecodingFailed' },
] as const

export const wavsAttesterAddress =
  '0x10fa1Bd26682EBb102347fE74BEc50a2956fB47E' as const

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
              { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
      { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
          { name: 'timestamp', internalType: 'uint256', type: 'uint256' },
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
  '0x4C4a5b5D6aCD14Acc0a9E6647D6Fc9E3053C6127' as const

export const wavsIndexerConfig = {
  address: wavsIndexerAddress,
  abi: wavsIndexerAbi,
} as const
