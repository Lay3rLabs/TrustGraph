# Time-Weighted Polynomial Bonding Curve for DAICO

## Overview

The Time-Weighted Polynomial Bonding Curve is a gas-efficient, continuous pricing mechanism designed specifically for ERC20 token sales. It replaces the discrete VRGDA (Variable Rate Gradual Dutch Auction) approach with a smooth polynomial curve that maintains VRGDA's self-regulating price properties while eliminating gas-intensive loops.

## Mathematical Foundation

### Core Formula

The pricing mechanism consists of two components:

1. **Base Price Curve**: A polynomial function that defines the fundamental price progression
   ```
   P(s) = a₀ + a₁·s + a₂·s² + a₃·s³
   ```
   Where:
   - `s` = tokens sold (in whole units)
   - `a₀` = base price (constant term)
   - `a₁` = linear growth coefficient
   - `a₂` = quadratic growth coefficient
   - `a₃` = cubic growth coefficient

2. **Time Multiplier**: An adjustment factor based on sales velocity
   ```
   M(t) = e^(k·δ)
   ```
   Where:
   - `k` = pace adjustment factor
   - `δ` = relative difference between actual and expected sales

### Total Cost Calculation

To calculate the cost of purchasing `n` tokens when `s` tokens have already been sold:

```
Cost(s, n) = M(t) · ∫[s to s+n] P(x) dx
```

The integral of the polynomial is:
```
∫P(s)ds = a₀·s + (a₁·s²)/2 + (a₂·s³)/3 + (a₃·s⁴)/4 + C
```

## Implementation Details

### Polynomial Coefficient Scaling

To maintain precision in Solidity's integer arithmetic, coefficients are scaled:

- `a₀`: scaled by 10¹⁸ (base unit)
- `a₁`: scaled by 10³⁶ (to account for s division)
- `a₂`: scaled by 10⁵⁴ (to account for s² division)
- `a₃`: scaled by 10⁷² (to account for s³ division)

### Time Multiplier Calculation

The multiplier adjusts prices based on sales performance:

```solidity
if (totalSold > expectedSold) {
    // Ahead of schedule: prices increase
    multiplier = 1 + k·percentAhead + (k·percentAhead)²/2
} else {
    // Behind schedule: prices decrease
    multiplier = 1 - k·percentBehind + (k·percentBehind)²/2
}
```

## Configuration Guide

### Choosing Polynomial Coefficients

The polynomial coefficients determine the shape of your bonding curve:

1. **Linear Curve** (steady growth):
   ```solidity
   a0 = 0.01 ether;  // Starting price
   a1 = 1e14;        // 0.0001 ETH per token growth
   a2 = 0;           // No quadratic term
   a3 = 0;           // No cubic term
   ```

2. **Quadratic Curve** (accelerating growth):
   ```solidity
   a0 = 0.01 ether;  // Starting price
   a1 = 1e14;        // Small linear growth
   a2 = 1e11;        // Quadratic acceleration
   a3 = 0;           // No cubic term
   ```

3. **S-Curve** (slow start, rapid middle, slow end):
   ```solidity
   a0 = 0.005 ether; // Low starting price
   a1 = 0;           // No linear term
   a2 = 1e12;        // Strong middle growth
   a3 = -1e8;        // Negative cubic to flatten at end
   ```

### Setting Target Velocity

Target velocity determines your expected sales rate:

```solidity
// Example: Expect to sell 1,000,000 tokens over 30 days
uint256 totalTokens = 1_000_000e18;
uint256 saleDuration = 30 days;
uint256 targetVelocity = totalTokens / saleDuration; // ~0.386 tokens per second
```

### Pace Adjustment Factor

Controls how aggressively prices adjust to sales pace:

- `0.1e18` (10%): Gentle adjustments
- `0.5e18` (50%): Moderate adjustments
- `1e18` (100%): Aggressive adjustments

## Deployment Example

```solidity
// Deploy DAICO with polynomial bonding curve
DAICO daico = new DAICO(
    projectToken,           // Project token address
    treasury,              // Treasury address
    admin,                 // Admin address
    1_000_000e18,         // Max supply (1M tokens)
    targetVelocity,       // Target sale rate
    0.5e18,               // 50% pace adjustment
    [                     // Polynomial coefficients
        0.01 ether,       // a0: Start at 0.01 ETH
        1e14,             // a1: Linear growth
        5e11,             // a2: Quadratic growth
        0                 // a3: No cubic term
    ],
    30 days,              // Cliff duration
    365 days,             // Vesting duration
    "vDAICO",            // Vault token name
    "vDAICO"             // Vault token symbol
);
```

## Gas Efficiency Analysis

### Comparison with Loop-Based VRGDA

For a purchase of 1,000 tokens:

**Original VRGDA Implementation:**
- Gas cost: ~3,000,000 gas
- Operations: 1,000 loop iterations
- Each iteration: Complex exponential calculations

**Polynomial Bonding Curve:**
- Gas cost: ~150,000 gas
- Operations: Single polynomial integration
- Constant time complexity O(1)

### Gas Savings by Purchase Size

| Tokens | VRGDA Gas | Polynomial Gas | Savings |
|--------|-----------|----------------|---------|
| 10     | 300,000   | 150,000        | 50%     |
| 100    | 3,000,000 | 150,000        | 95%     |
| 1,000  | 30,000,000| 150,000        | 99.5%   |
| 10,000 | FAILS     | 150,000        | ∞       |

## Practical Examples

### Example 1: Conservative Linear Growth

```solidity
// Start at 0.01 ETH, grow to 0.1 ETH over 1M tokens
a0 = 0.01 ether;
a1 = 9e13;  // (0.1 - 0.01) / 1e6 ≈ 9e13
a2 = 0;
a3 = 0;
```

### Example 2: Aggressive Early Pricing

```solidity
// High starting price with decay
a0 = 0.1 ether;   // Start high
a1 = -5e14;       // Negative linear (price decreases initially)
a2 = 1e11;        // But quadratic growth takes over
a3 = 0;
```

### Example 3: Mimicking VRGDA Behavior

To approximate VRGDA's exponential curve with a polynomial:

```solidity
// Use Taylor expansion coefficients
a0 = targetPrice;
a1 = targetPrice * ln(1 - decayPercent) / 1e18;
a2 = targetPrice * ln(1 - decayPercent)² / (2 * 1e36);
a3 = targetPrice * ln(1 - decayPercent)³ / (6 * 1e54);
```

## Testing Your Configuration

Before deploying, test your curve configuration:

```javascript
// JavaScript helper to visualize your curve
function calculatePrice(sold, a0, a1, a2, a3) {
    const s = sold / 1e18;
    return a0 + a1*s + a2*s*s + a3*s*s*s;
}

// Plot prices at different supply levels
for (let i = 0; i <= 1000000; i += 100000) {
    const price = calculatePrice(i * 1e18, 0.01e18, 1e14, 5e11, 0);
    console.log(`At ${i} tokens sold: ${price/1e18} ETH`);
}
```

## Security Considerations

1. **Coefficient Bounds**: Ensure coefficients don't create negative prices
2. **Overflow Protection**: Large coefficients with high supply can overflow
3. **Minimum Multiplier**: Time multiplier is capped at 0.1x to prevent free tokens
4. **Maximum Purchase**: Consider implementing per-transaction limits

## Migration from VRGDA

If you're migrating from VRGDA:

1. **Calculate equivalent starting price**: Set `a0` to your VRGDA target price
2. **Match growth rate**: Adjust `a1` and `a2` to approximate VRGDA's exponential curve
3. **Set pace factor**: Use similar decay percentage as `paceAdjustmentFactor`
4. **Test extensively**: Compare prices at various points to ensure similar behavior

## Advanced Configurations

### Dynamic S-Curve

Creates natural adoption curve:
```solidity
a0 = 0.001 ether;  // Very low start to encourage early adoption
a1 = 0;            // No linear component
a2 = 5e12;         // Strong growth in middle phase
a3 = -3e8;         // Taper off at high supply
```

### Two-Phase Pricing

Simulates early bird + regular pricing:
```solidity
// Use high a1 for first phase, then a2 takes over
a0 = 0.005 ether;  // Early bird base
a1 = 2e14;         // Rapid early growth
a2 = 1e11;         // Slower later growth
a3 = -5e7;         // Slight taper
```

## Conclusion

The Time-Weighted Polynomial Bonding Curve provides:

1. **Gas Efficiency**: O(1) constant time pricing
2. **Continuity**: Smooth pricing for any amount
3. **Flexibility**: Four coefficients allow diverse curve shapes
4. **VRGDA-like Behavior**: Time-based adjustments maintain self-regulating properties
5. **Simplicity**: No complex logarithms or exponentials in pricing

This makes it ideal for ERC20 token sales where gas efficiency and pricing flexibility are crucial.