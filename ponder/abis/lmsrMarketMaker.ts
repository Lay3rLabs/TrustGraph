export const lmsrMarketMakerAbi = [
  {
    type: "function",
    name: "calcMarginalPrice",
    inputs: [
      { name: "outcomeTokenIndex", type: "uint8", internalType: "uint8" },
    ],
    outputs: [{ name: "price", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AMMOutcomeTokenTrade",
    inputs: [
      {
        name: "transactor",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "outcomeTokenAmounts",
        type: "int256[]",
        indexed: false,
        internalType: "int256[]",
      },
      {
        name: "outcomeTokenNetCost",
        type: "int256",
        indexed: false,
        internalType: "int256",
      },
      {
        name: "marketFees",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
] as const;
