# The Plan

Figma: https://www.figma.com/proto/uGHgh87RIFS0GUlLR68hCs/TrustGraph-Wireframes?node-id=20-134

TODO: explore configuration...

- Network overview on network page
- Add copy, new landing page
- Make network info config with copy

- Contact support button
- update site metadata
- Live updates
- need a graph visualization

Needs discussion:
- Calibrate math so scores are right? (open questions about this)

Potential Bugs (need testing):
- Don't allow self-attestations, these shouldn't account
- Handle multiple attestations from the same account to the same account
- Set max 100 on confidence level

Test:
- ENS support

# Deploying
- Deploy somewhere so people can try
- Clean git history
- Open Source
- Deploy on Celo
- Publish WAVS packages


# Clean up
- formatVotingPower is baddly named (kill, it's just using BigInt, there must be a function in one of our packages)
- Remove followers logic from ponder indexer
- Rename component from merkler to trust graph
- Documentation for merkler component
- Refactor to consume upstream packages from WAVS tools
- Docs so people unfamiliar with WAVS can run it
- Make sure tasks are named appropriately

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
