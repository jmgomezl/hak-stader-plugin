# Stader Plugin — Usage Examples

## Basic Staking

```typescript
import HederaAgentKit from "@hashgraph/hedera-agent-kit";
import { staderPlugin, STADER_MAINNET } from "hak-stader-plugin";

const agent = new HederaAgentKit(
  process.env.HEDERA_ACCOUNT_ID!,
  process.env.HEDERA_PRIVATE_KEY!,
  { network: "mainnet" }
);

agent.registerPlugin(staderPlugin, { ...STADER_MAINNET, network: "mainnet" });

// Check protocol status before staking
await agent.run("Check if Stader staking is currently available");

// Stake 100 HBAR
await agent.run("Stake 100 HBAR with Stader to get HBARX");

// Check your HBARX balance
await agent.run("What is my HBARX balance?");
```

## Checking Exchange Rate and TVL

```typescript
// Get current rate and total value locked
await agent.run("What is the current HBARX exchange rate and total HBAR staked with Stader?");
```

Response includes:
- `exchange_rate_hbar_per_hbarx`: computed from treasury balance (real rate, not the deprecated on-chain function)
- `total_staked_hbar`: total HBAR held by the protocol
- `total_hbarx_supply`: total HBARX in circulation

## Full Unstake Flow

Unstaking requires three steps. The agent can handle them in sequence:

```typescript
// Step 1: Approve HBARX allowance
await agent.run("Approve 100 HBARX for Stader unstaking");

// Step 2: Initiate unstake (1-day unbonding begins)
await agent.run("Unstake 100 HBARX from Stader");

// Step 3: Check pending withdrawals after ~1 day
await agent.run("Show my pending Stader withdrawals");

// Step 4: Claim after unbonding period
await agent.run("Claim my Stader withdrawal at index 0");
```

## SaucerSwap Yield Loop

Combining `hak-stader-plugin` with `hak-saucerswap-plugin` enables a full agent-driven DeFi yield loop:

```typescript
import { staderPlugin, STADER_MAINNET } from "hak-stader-plugin";
import { saucerswapPlugin, SAUCERSWAP_MAINNET } from "hak-saucerswap-plugin";

agent.registerPlugin(staderPlugin, { ...STADER_MAINNET, network: "mainnet" });
agent.registerPlugin(saucerswapPlugin, { ...SAUCERSWAP_MAINNET, network: "mainnet" });

// Full yield loop in natural language:
await agent.run(`
  1. Check the current HBARX exchange rate and Stader protocol status.
  2. Stake 1000 HBAR with Stader to receive HBARX.
  3. Check my HBARX balance after staking.
  4. Show available HBARX/HBAR liquidity pools on SaucerSwap.
`);
```

**Loop rationale:**
- **Stader staking** earns node staking rewards (~5-7% APR) embedded in the HBARX/HBAR exchange rate
- **SaucerSwap LP** with HBARX/HBAR earns trading fees on top of the embedded staking yield
- **SaucerSwap farms** can add SAUCE/other token rewards on eligible pools

## Monitoring a Position

```typescript
// Full position summary in one prompt
await agent.run(`
  Give me a complete summary of my Stader position:
  - My current HBARX balance
  - The HBARX exchange rate
  - Any pending withdrawals and whether they are claimable
`);
```

## Error Handling Examples

The plugin always returns `{ success: false, error: "..." }` — it never throws. Agents can handle this gracefully:

```typescript
// Agent will detect the error and surface a useful message
await agent.run("Unstake 100 HBARX");
// → Will inform user that stader_approve_hbarx must be called first
//   (contract reverts if allowance is missing)

await agent.run("Claim my withdrawal at index 0");
// → If unbonding period hasn't passed, contract reverts with an informative error
```
