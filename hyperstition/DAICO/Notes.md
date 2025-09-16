# Notes on DAICO

## Pricing considerations
Step pricing seems sensible, and naturally aligns with a phase based approach. Needs legal review, as it may conflict with most favored nations clause (however our investors can choose to participate in the DAICO).

Dutch Auction is great, because we don't have to worry about annoying our investors by potentially selling for less than the price they paid (or at least we have no control over that).

Everyone likes / is familiar with bonding curves these days... but they tend to reward snipers, so VRGDA is a good alternative.

We may want to do more Lock Drop style drop when we launch the bridge.

Step pricing may be best?

## vToken Speculation Dynamics
When participating in a DAICO, you get vTokens which represent your share of the project's treasury and future tokens. These vTokens can be traded on secondary markets, creating a dual-market dynamic where holders can speculate on multiple outcomes.

### Yes, vTokens Are Speculative Assets!

vTokens create a fascinating dual-market dynamic where holders can speculate on multiple outcomes:

### Speculation Opportunities

#### 1. **Treasury Redemption Play**
- vTokens can be redeemed for proportional share of remaining treasury
- If DAICO raises $10M and tap only withdraws $2M before dissolution → 80% redemption value
- Speculate that project will be dissolved early with significant treasury remaining
- Buy vTokens on secondary market below treasury NAV for instant arbitrage

#### 2. **Project Token Vesting Play**
- vTokens can be exchanged for vested EN0 project tokens
- If EN0 tokens trade at $500 but VRGDA price is $200 → 2.5x multiplier
- Accumulate vTokens to claim cheap EN0 tokens as they vest
- Creates a "warrant-like" instrument with time value

#### 3. **Governance Power Play**
- vTokens = voting power for tap increases and dissolution
- Accumulate vTokens to control project funding destiny
- Activist investors could force dissolution for redemption
- Project supporters could increase tap to accelerate development

#### 4. **VRGDA Arbitrage**
- VRGDA price changes create arbitrage windows
- Buy from DAICO when price is low (behind schedule)
- Sell vTokens on secondary when VRGDA price rises
- Or hold for treasury/project token value if that exceeds purchase price

### Secondary Market Dynamics

```
vToken Market Price Factors:
├── Treasury NAV (floor value)
├── EN0 token price * vesting ratio (upside value)
├── VRGDA current price (opportunity cost)
├── Governance premium (control value)
└── Time value (vesting acceleration)
```

### Speculation Strategies

#### Bull Case Speculation
- **Bet**: Project succeeds, EN0 moons, vTokens claim cheap EN0
- **Strategy**: Buy vTokens below (EN0 price * vesting %)
- **Risk**: Project could fail or EN0 could dump
- **Reward**: Leveraged exposure to EN0 upside

#### Bear Case Speculation
- **Bet**: Project fails, dissolution returns treasury
- **Strategy**: Buy vTokens below treasury NAV
- **Risk**: Project could succeed and drain treasury via tap
- **Reward**: Protected downside with treasury floor

#### Volatility Speculation
- **Bet**: vToken price swings create trading opportunities
- **Strategy**: Trade the spread between VRGDA, NAV, and market price
- **Risk**: Low liquidity, wide spreads
- **Reward**: Multiple arbitrage angles

### Implications for the DAICO

#### Positive Effects
1. **Price Discovery**: Secondary market provides real-time project valuation
2. **Liquidity**: Contributors can exit before vesting/dissolution
3. **Governance Participation**: Speculation brings active governance
4. **Funding Efficiency**: Arbitrageurs ensure VRGDA stays on target

#### Potential Concerns
1. **Governance Attacks**: Speculators might force premature dissolution
2. **Price Manipulation**: Whales could corner vToken market
3. **Misaligned Incentives**: Short-term traders vs long-term builders
4. **Complexity**: Multiple pricing layers confuse retail

### Mitigation Mechanisms

To balance speculation with project stability:

1. **Dissolution Threshold**: Require 67% supermajority to dissolve
2. **Vesting Cliffs**: Delay project token claims to prevent quick flips
3. **Governance Timelock**: Delay proposal execution by 48-72 hours
4. **Tap Rate Limits**: Cap maximum tap increase per period
5. **Anti-Whale Measures**: Cap maximum vToken holdings per address

### Market Making Opportunities

vTokens create natural market making opportunities:
- **Primary ↔ Secondary**: Arbitrage between VRGDA and market price
- **vToken ↔ EN0**: Arbitrage vesting discount vs market price
- **Treasury ↔ Market**: Arbitrage NAV discount vs market price

This creates a rich, multi-layered market that:
- Provides continuous price discovery
- Enables various risk/reward profiles
- Attracts sophisticated capital
- Maintains alignment through skin in the game
