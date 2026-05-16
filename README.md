# hak-stader-plugin

Hedera Agent Kit plugin for [Stader](https://www.staderlabs.com/hedera/) liquid staking on Hedera.

Stake HBAR → receive **HBARX** (a yield-bearing liquid staking token). HBARX earns staking rewards while remaining transferable and usable in DeFi — enabling a full agent-driven yield loop with [hak-saucerswap-plugin](https://github.com/jmgomezl/hak-saucerswap-plugin):

**Stake HBAR → receive HBARX → LP on SaucerSwap → farm rewards**

## Installation

```bash
npm install hak-stader-plugin
```

## Quick Start

```typescript
import HederaAgentKit from "@hashgraph/hedera-agent-kit";
import { staderPlugin, STADER_MAINNET } from "hak-stader-plugin";

const agent = new HederaAgentKit(
  process.env.HEDERA_ACCOUNT_ID!,
  process.env.HEDERA_PRIVATE_KEY!,
  { network: "mainnet" }
);

agent.registerPlugin(staderPlugin, {
  ...STADER_MAINNET,
  network: "mainnet",
});
```

Or using environment variables (see [docs/CONFIGURATION.md](docs/CONFIGURATION.md)):

```bash
STADER_NETWORK=mainnet
```

```typescript
agent.registerPlugin(staderPlugin);
```

## Tools

| Tool | Type | Description |
|------|------|-------------|
| `stader_stake_hbar` | Transaction | Stake HBAR and receive HBARX |
| `stader_approve_hbarx` | Transaction | Approve HBARX allowance before unstaking |
| `stader_unstake_hbar` | Transaction | Initiate unstake (1-day unbonding) |
| `stader_claim_withdrawal` | Transaction | Claim HBAR after unbonding period |
| `stader_get_pending_withdrawals` | Query | List pending withdrawal requests |
| `stader_get_hbarx_balance` | Query | Get HBARX token balance for an account |
| `stader_get_exchange_rate` | Query | Get HBARX/HBAR exchange rate and TVL |
| `stader_get_staking_info` | Query | Get protocol status (paused, unbonding time) |

See [docs/TOOLS.md](docs/TOOLS.md) for full parameter reference.

## Network Defaults

| Field | Mainnet | Testnet |
|-------|---------|---------|
| Staking contract | `0.0.1027588` | `0.0.48247334`* |
| Undelegation contract | `0.0.1027587` | `0.0.48247333`* |
| HBARX token | `0.0.834116` | `0.0.48247328`* |
| Treasury account | `0.0.1412503` | `0.0.48247329`* |

\* Testnet deployment is no longer active on the current Hedera testnet environment.

## Unstaking Flow

Unstaking HBARX requires three steps:

1. **Approve** — `stader_approve_hbarx` (grant HBARX allowance to the staking contract)
2. **Unstake** — `stader_unstake_hbar` (burns HBARX, begins 1-day unbonding)
3. **Claim** — `stader_claim_withdrawal` (after unbonding, retrieves HBAR)

## Exchange Rate Note

The on-chain `getExchangeRate()` function is deprecated and returns 1.0. This plugin computes the real rate from `treasury_hbar / hbarx_supply` via the Hedera Mirror Node. The true rate reflects accrued staking rewards (~1.4 HBAR/HBARX as of mid-2025).

## License

MIT — [Juanma Gomez](https://github.com/jmgomezl)
