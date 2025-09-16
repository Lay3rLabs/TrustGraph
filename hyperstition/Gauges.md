# Guages

### Prior Art: Curve
Curve Finance uses a sophisticated **gauge system** to distribute CRV token rewards to liquidity providers across different pools. Here's how it works in detail:

#### What Are Curve Gauges?

Gauges are smart contracts that measure and reward liquidity provision in specific Curve pools. Each pool that receives CRV emissions has an associated gauge contract where liquidity providers can stake their LP (liquidity provider) tokens to earn rewards.

#### Core Mechanics

**1. LP Token Staking**
- Liquidity providers deposit assets into Curve pools and receive LP tokens
- These LP tokens are then staked in the corresponding gauge contract
- Staked LP tokens continue earning trading fees while also earning CRV rewards

**2. Gauge Weight System**
- Each gauge has a "weight" that determines what percentage of total CRV emissions it receives
- Weights are updated weekly and determined by community voting
- Higher weight = more CRV rewards for that pool's liquidity providers

#### veToken Voting Mechanism

**3. Vote-Escrowed CRV (veCRV)**
- CRV holders can lock their tokens for up to 4 years to receive veCRV
- Longer lock periods provide more veCRV (voting power)
- veCRV holders vote on gauge weights every 10 days

**4. Gauge Weight Voting**
- veCRV holders allocate their voting power across different gauges
- Each user can distribute their votes among multiple gauges
- Votes decay linearly and must be refreshed periodically
- The collective votes determine each gauge's relative weight

#### Reward Distribution

**5. CRV Emission Schedule**
- CRV has a decreasing emission schedule (similar to Bitcoin's halving)
- Total weekly CRV emissions are distributed proportionally based on gauge weights
- Individual rewards depend on:
  - Pool's gauge weight
  - User's share of staked LP tokens in that gauge
  - Current CRV emission rate

**6. Boosting Mechanism**
- veCRV holders receive "boosted" rewards (up to 2.5x) on their own liquidity provision
- Boost amount depends on:
  - Amount of veCRV held
  - Amount of LP tokens staked
  - Total liquidity in the pool
- This incentivizes long-term CRV holding alongside liquidity provision

#### Strategic Implications

**7. Governance and Incentives**
- Creates alignment between CRV holders and liquidity providers
- Encourages long-term participation through vote-locking
- Allows community to direct rewards to most valuable/needed pools
- Enables protocols to "bribe" veCRV holders for votes (via platforms like Votium)

**8. Flywheel Effects**
- More CRV rewards attract more liquidity
- More liquidity improves trading efficiency and fee generation
- Better pools attract more trading volume
- Higher fees make pools more attractive to liquidity providers

This gauge system effectively decentralizes the decision of where to allocate liquidity mining rewards while creating strong incentives for long-term participation and governance engagement. It's become a model that many other DeFi protocols have adopted or adapted.

## WAVS Version

Support:
- Liquidity mining programs
- Merkle reward distribution (ideally multichain)
- Vote-weighted token emissions
- Boosts
- Multi-token emissions (we plan to have gauges that distribute protocol yield in tokens that may not be mintable such as USDC)

Design:
- We should mostly follow the design of Curve's Gauge system, but with additional features such as cross-chain reward bridging and multi-token emissions.
- We should leverage WAVS for reward calculation and distribution.

Changes from Curve:
- More generic, support more types of activities and allocation of different tokens for emissions
- Instead of LP Token Staking, we use vaults to support other types of activities. (we want to make a more generic system)
- Performance based incentives
- Merkle based rewards distribution
- More means of boosting
- Allocates more than just $EN0 emissions

# Core Components
## 1. GaugeController
Purpose: Central registry and weight management for all gauges

Key Features:
- Gauge registration and type management
- Voting weight aggregation and distribution
- Emission rate calculations
- Cross-chain gauge coordination

## 2. LiquidityGauge
Purpose: Individual gauge instances that track user deposits and calculate rewards

Key Features:
- User deposit/withdrawal tracking
- Reward accumulation and distribution
- Boost calculation integration
- Multi-token reward support

## 3. Minter
Purpose: Token emission controller with configurable inflation schedules

Key Features:
- Inflation rate management
- Epoch-based emission scheduling
- Multi-token minting capabilities
- Emergency controls

## 4. VotingEscrow
Purpose: Governance token locking mechanism for voting power and reward boosting

Key Features:
- Time-weighted voting power
- Boost multiplier calculations
- Delegation support
- Lock extension mechanisms
