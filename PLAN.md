# The Plan

Figma: https://www.figma.com/proto/uGHgh87RIFS0GUlLR68hCs/TrustGraph-Wireframes?node-id=20-134

- Remove unused attestation schema types from frontend (comment out in contracts)
- Create trust schema
- Change default schema to trust
- Add ENS support
- Address component
- Add copy, new landing page
- Add profile link somewhere
- Navigate to network from account link
- Contact support button
- update site metadata
- Calibrate math so scores are right? (open questions about this)
- need a graph visualization
- Documentation for merkler component
- Live updates

# Deploying
- Deploy somewhere so people can try
- Clean git history
- Open Source
- Deploy on Celo


# Clean up
- formatVotingPower is baddly named (kill, it's just using BigInt, there must be a function in one of our packages)
- Remove followers logic from ponder indexer
- Rename component from merkler to trust graph
- Refactor to consume upstream packages from WAVS tools
- Docs so people unfamiliar with WAVS can run it

# Governance extra credit
- Experimental notice on governance page
- create proposal doesn't submit amount as big int (it's in wei)
- Add threshold to Merkle Gov Module contract
- Implement and document the fallback mechanism for governance (this should be fairly straightforward with Zodiac hopefully)
- A DAO needs to be able to update it's own service configuration (related to Gyser?)
- Conduct AI audit of contracts
- Add Gov Paper

# Rewards extra credit
- Add Rewards so this is a complete DAO governance system
- Activate rewards page?
