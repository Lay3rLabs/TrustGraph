//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AttestationGovernor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const attestationGovernorAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract IVotes', type: 'address' },
      {
        name: '_timelock',
        internalType: 'contract TimelockController',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'BALLOT_TYPEHASH',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
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
    name: 'COUNTING_MODE',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'EXTENDED_BALLOT_TYPEHASH',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
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
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'cancel',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
    ],
    name: 'castVote',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'voter', internalType: 'address', type: 'address' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'castVoteBySig',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'castVoteWithReason',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'params', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'castVoteWithReasonAndParams',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'support', internalType: 'uint8', type: 'uint8' },
      { name: 'voter', internalType: 'address', type: 'address' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'params', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'castVoteWithReasonAndParamsBySig',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
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
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'execute',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getProposalId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
      { name: 'params', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'getVotesWithParams',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
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
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'hashProposal',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
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
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalDeadline',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalDetails',
    outputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalDetailsAt',
    outputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalEta',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalNeedsQueuing',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalProposer',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proposalThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'proposalVotes',
    outputs: [
      { name: 'againstVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'forVotes', internalType: 'uint256', type: 'uint256' },
      { name: 'abstainVotes', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'description', internalType: 'string', type: 'string' },
    ],
    name: 'propose',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'targets', internalType: 'address[]', type: 'address[]' },
      { name: 'values', internalType: 'uint256[]', type: 'uint256[]' },
      { name: 'calldatas', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptionHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'queue',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'queue',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'timepoint', internalType: 'uint256', type: 'uint256' }],
    name: 'quorum',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'quorumDenominator',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'timepoint', internalType: 'uint256', type: 'uint256' }],
    name: 'quorumNumerator',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'quorumNumerator',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'relay',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newProposalThreshold',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'setProposalThreshold',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newVotingDelay', internalType: 'uint48', type: 'uint48' },
    ],
    name: 'setVotingDelay',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newVotingPeriod', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'setVotingPeriod',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'state',
    outputs: [
      { name: '', internalType: 'enum IGovernor.ProposalState', type: 'uint8' },
    ],
    stateMutability: 'view',
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
    name: 'timelock',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC5805', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newQuorumNumerator', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateQuorumNumerator',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'newTimelock',
        internalType: 'contract TimelockController',
        type: 'address',
      },
    ],
    name: 'updateTimelock',
    outputs: [],
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
  { type: 'event', anonymous: false, inputs: [], name: 'EIP712DomainChanged' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ProposalCanceled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'proposer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'targets',
        internalType: 'address[]',
        type: 'address[]',
        indexed: false,
      },
      {
        name: 'values',
        internalType: 'uint256[]',
        type: 'uint256[]',
        indexed: false,
      },
      {
        name: 'signatures',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
      {
        name: 'calldatas',
        internalType: 'bytes[]',
        type: 'bytes[]',
        indexed: false,
      },
      {
        name: 'voteStart',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'voteEnd',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'description',
        internalType: 'string',
        type: 'string',
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
        indexed: false,
      },
    ],
    name: 'ProposalExecuted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'etaSeconds',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ProposalQueued',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldProposalThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newProposalThreshold',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ProposalThresholdSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldQuorumNumerator',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newQuorumNumerator',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'QuorumNumeratorUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldTimelock',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newTimelock',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'TimelockChange',
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
        indexed: false,
      },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'weight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
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
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'proposalId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'support', internalType: 'uint8', type: 'uint8', indexed: false },
      {
        name: 'weight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'reason',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      { name: 'params', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'VoteCastWithParams',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldVotingDelay',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotingDelay',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotingDelaySet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldVotingPeriod',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newVotingPeriod',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VotingPeriodSet',
  },
  { type: 'error', inputs: [], name: 'CheckpointUnorderedInsertion' },
  { type: 'error', inputs: [], name: 'FailedCall' },
  {
    type: 'error',
    inputs: [{ name: 'voter', internalType: 'address', type: 'address' }],
    name: 'GovernorAlreadyCastVote',
  },
  {
    type: 'error',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'GovernorAlreadyQueuedProposal',
  },
  { type: 'error', inputs: [], name: 'GovernorDisabledDeposit' },
  {
    type: 'error',
    inputs: [
      { name: 'proposer', internalType: 'address', type: 'address' },
      { name: 'votes', internalType: 'uint256', type: 'uint256' },
      { name: 'threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'GovernorInsufficientProposerVotes',
  },
  {
    type: 'error',
    inputs: [
      { name: 'targets', internalType: 'uint256', type: 'uint256' },
      { name: 'calldatas', internalType: 'uint256', type: 'uint256' },
      { name: 'values', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'GovernorInvalidProposalLength',
  },
  {
    type: 'error',
    inputs: [
      { name: 'quorumNumerator', internalType: 'uint256', type: 'uint256' },
      { name: 'quorumDenominator', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'GovernorInvalidQuorumFraction',
  },
  {
    type: 'error',
    inputs: [{ name: 'voter', internalType: 'address', type: 'address' }],
    name: 'GovernorInvalidSignature',
  },
  { type: 'error', inputs: [], name: 'GovernorInvalidVoteParams' },
  { type: 'error', inputs: [], name: 'GovernorInvalidVoteType' },
  {
    type: 'error',
    inputs: [
      { name: 'votingPeriod', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'GovernorInvalidVotingPeriod',
  },
  {
    type: 'error',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'GovernorNonexistentProposal',
  },
  {
    type: 'error',
    inputs: [{ name: 'proposalId', internalType: 'uint256', type: 'uint256' }],
    name: 'GovernorNotQueuedProposal',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'GovernorOnlyExecutor',
  },
  { type: 'error', inputs: [], name: 'GovernorQueueNotImplemented' },
  {
    type: 'error',
    inputs: [{ name: 'proposer', internalType: 'address', type: 'address' }],
    name: 'GovernorRestrictedProposer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'GovernorUnableToCancel',
  },
  {
    type: 'error',
    inputs: [
      { name: 'proposalId', internalType: 'uint256', type: 'uint256' },
      {
        name: 'current',
        internalType: 'enum IGovernor.ProposalState',
        type: 'uint8',
      },
      { name: 'expectedStates', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'GovernorUnexpectedProposalState',
  },
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Attester
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const attesterAbi = [
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
    inputs: [
      { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'attest',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
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
    name: 'handleSignedEnvelope',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schemas', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'recipients', internalType: 'address[][]', type: 'address[][]' },
      { name: 'schemaData', internalType: 'bytes[][]', type: 'bytes[][]' },
    ],
    name: 'multiAttest',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schemas', internalType: 'bytes32[]', type: 'bytes32[]' },
      { name: 'schemaUids', internalType: 'bytes32[][]', type: 'bytes32[][]' },
    ],
    name: 'multiRevoke',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schema', internalType: 'bytes32', type: 'bytes32' },
      { name: 'uid', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'revoke',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'InvalidEAS' },
  { type: 'error', inputs: [], name: 'InvalidInput' },
  { type: 'error', inputs: [], name: 'InvalidServiceManager' },
] as const

export const attesterAddress =
  '0x6B5bBEFE4d78eCDA1c29D5978A1AEf6BA4393879' as const

export const attesterConfig = {
  address: attesterAddress,
  abi: attesterAbi,
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

export const easAddress = '0x3Cbe968aDcD5033e5704CEbB807F262492E264Bb' as const

export const easConfig = { address: easAddress, abi: easAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EASAttestTrigger
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const easAttestTriggerAbi = [
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
] as const

export const easAttestTriggerAddress =
  '0x17fd747B6dFd3688d7b442C3Bde045B85d56Bb85' as const

export const easAttestTriggerConfig = {
  address: easAttestTriggerAddress,
  abi: easAttestTriggerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Indexer
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const indexerAbi = [
  {
    type: 'constructor',
    inputs: [{ name: 'eas', internalType: 'contract IEAS', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getEAS',
    outputs: [{ name: '', internalType: 'contract IEAS', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getReceivedAttestationUIDCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getReceivedAttestationUIDs',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getSchemaAttestationUIDCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getSchemaAttestationUIDs',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
      { name: 'attester', internalType: 'address', type: 'address' },
      { name: 'recipient', internalType: 'address', type: 'address' },
    ],
    name: 'getSchemaAttesterRecipientAttestationUIDCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
      { name: 'attester', internalType: 'address', type: 'address' },
      { name: 'recipient', internalType: 'address', type: 'address' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getSchemaAttesterRecipientAttestationUIDs',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'attester', internalType: 'address', type: 'address' },
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'getSentAttestationUIDCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'attester', internalType: 'address', type: 'address' },
      { name: 'schemaUID', internalType: 'bytes32', type: 'bytes32' },
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
      { name: 'reverseOrder', internalType: 'bool', type: 'bool' },
    ],
    name: 'getSentAttestationUIDs',
    outputs: [{ name: '', internalType: 'bytes32[]', type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'attestationUID', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'indexAttestation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'attestationUIDs', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'indexAttestations',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'attestationUID', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'isAttestationIndexed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
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
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: true },
    ],
    name: 'Indexed',
  },
  { type: 'error', inputs: [], name: 'InvalidAttestation' },
  { type: 'error', inputs: [], name: 'InvalidEAS' },
  { type: 'error', inputs: [], name: 'InvalidOffset' },
] as const

export const indexerAddress =
  '0x80a8Bf845022927b11137065034AFAa96Dc61937' as const

export const indexerConfig = {
  address: indexerAddress,
  abi: indexerAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IndexerResolver
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const indexerResolverAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'eas', internalType: 'contract IEAS', type: 'address' },
      { name: '_indexer', internalType: 'contract Indexer', type: 'address' },
    ],
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
    name: 'indexer',
    outputs: [{ name: '', internalType: 'contract Indexer', type: 'address' }],
    stateMutability: 'view',
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
      { name: 'uid', internalType: 'bytes32', type: 'bytes32', indexed: true },
    ],
    name: 'AttestationIndexed',
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

export const indexerResolverAddress =
  '0x3D591d974df59eB4976624Ca9efDf9834e4f044a' as const

export const indexerResolverConfig = {
  address: indexerResolverAddress,
  abi: indexerResolverAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RewardDistributor
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const rewardDistributorAbi = [
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
    name: 'acceptRoot',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'addTrigger',
    outputs: [],
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
    inputs: [
      { name: '_triggerId', internalType: 'ITypes.TriggerId', type: 'uint64' },
    ],
    name: 'getData',
    outputs: [{ name: '_data', internalType: 'bytes', type: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_triggerId', internalType: 'ITypes.TriggerId', type: 'uint64' },
    ],
    name: 'getSignature',
    outputs: [
      {
        name: '_signature',
        internalType: 'struct IWavsServiceHandler.SignatureData',
        type: 'tuple',
        components: [
          { name: 'signers', internalType: 'address[]', type: 'address[]' },
          { name: 'signatures', internalType: 'bytes[]', type: 'bytes[]' },
          { name: 'referenceBlock', internalType: 'uint32', type: 'uint32' },
        ],
      },
    ],
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
      { name: '_triggerId', internalType: 'ITypes.TriggerId', type: 'uint64' },
    ],
    name: 'isValidTriggerId',
    outputs: [{ name: '_isValid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
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
    name: 'WavsRewardsTrigger',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
] as const

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
  '0xE7F26EDB3b9Ab77Ce52954b066086B1a7D385c3B' as const

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
  '0xdcD1173e9D1e6Fc6006Fad7bed80C8C9607C9b9e' as const

export const schemaRegistryConfig = {
  address: schemaRegistryAddress,
  abi: schemaRegistryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// VotingPower
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const votingPowerAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_symbol', internalType: 'string', type: 'string' },
      { name: '_initialOwner', internalType: 'address', type: 'address' },
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
    name: 'CLOCK_MODE',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
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
    inputs: [
      { name: 'recipients', internalType: 'address[]', type: 'address[]' },
      { name: 'amounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'batchMint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
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
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getVotes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getVotingStats',
    outputs: [
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'votes', internalType: 'uint256', type: 'uint256' },
      { name: 'delegatedTo', internalType: 'address', type: 'address' },
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
    inputs: [
      { name: 'initialHolders', internalType: 'address[]', type: 'address[]' },
      { name: 'initialAmounts', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'initialDistribution',
    outputs: [],
    stateMutability: 'nonpayable',
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
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [],
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
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TokensBurned',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TokensMinted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'operationType',
        internalType: 'enum VotingPower.OperationType',
        type: 'uint8',
        indexed: true,
      },
      {
        name: 'totalAccounts',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'WAVSOperationExecuted',
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
      { name: 'timepoint', internalType: 'uint256', type: 'uint256' },
      { name: 'clock', internalType: 'uint48', type: 'uint48' },
    ],
    name: 'ERC5805FutureLookup',
  },
  { type: 'error', inputs: [], name: 'ERC6372InconsistentClock' },
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
  {
    type: 'error',
    inputs: [{ name: 'expiry', internalType: 'uint256', type: 'uint256' }],
    name: 'VotesExpiredSignature',
  },
] as const
