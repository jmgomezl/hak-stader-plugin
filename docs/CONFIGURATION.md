# Stader Plugin — Configuration Reference

## Precedence

Settings are resolved in this order (highest wins):

1. `context.config.stader` — per-call config (runtime)
2. `context.pluginConfig.stader` — plugin-level config at registration
3. Environment variables (`STADER_*`)
4. Network defaults (loaded when `STADER_NETWORK` is set)
5. Built-in defaults (gas limit, polling index)

## Settings

| Config key | Env var | Description | Required | Default |
|------------|---------|-------------|----------|---------|
| `network` | `STADER_NETWORK` | `"mainnet"` or `"testnet"` — loads all network defaults | No | — |
| `stakingContractId` | `STADER_STAKING_CONTRACT_ID` | Hedera contract ID of the Stader staking contract | Yes* | — |
| `undelegationContractId` | `STADER_UNDELEGATION_CONTRACT_ID` | Hedera contract ID of the undelegation contract | Yes* | — |
| `hbarxTokenId` | `STADER_HBARX_TOKEN_ID` | HTS token ID of HBARX | Yes* | — |
| `treasuryAccountId` | `STADER_TREASURY_ACCOUNT_ID` | Protocol treasury account (for exchange rate) | Yes* | — |
| `mirrorNodeBaseUrl` | `STADER_MIRROR_NODE_BASE_URL` | Hedera Mirror Node base URL | Yes* | — |
| `gasLimit` | `STADER_GAS_LIMIT` | Gas for `ContractExecuteTransaction` | No | `2000000` |
| `maxWithdrawalPollingIndex` | `STADER_MAX_WITHDRAWAL_INDEX` | Max indices polled for pending withdrawals | No | `20` |

\* Required for the tools that use them. Setting `STADER_NETWORK=mainnet` satisfies all of these automatically.

## Usage Examples

### Minimal — environment variable

```bash
STADER_NETWORK=mainnet
```

### Plugin registration with spread

```typescript
import { staderPlugin, STADER_MAINNET } from "hak-stader-plugin";

agent.registerPlugin(staderPlugin, {
  ...STADER_MAINNET,
  network: "mainnet",
});
```

### Per-call config override

```typescript
const result = await agent.run("What is the HBARX exchange rate?", {
  config: {
    stader: {
      mirrorNodeBaseUrl: "https://my-custom-mirror.example.com",
    },
  },
});
```

## Network Defaults

### Mainnet (`STADER_NETWORK=mainnet`)

| Field | Value |
|-------|-------|
| `stakingContractId` | `0.0.1027588` |
| `undelegationContractId` | `0.0.1027587` |
| `hbarxTokenId` | `0.0.834116` |
| `treasuryAccountId` | `0.0.1412503` |
| `mirrorNodeBaseUrl` | `https://mainnet-public.mirrornode.hedera.com` |

### Testnet (`STADER_NETWORK=testnet`)

> **Warning:** Stader does not maintain an active testnet deployment. These addresses existed in the early development phase but are no longer functional on the current Hedera testnet.

| Field | Value | Status |
|-------|-------|--------|
| `stakingContractId` | `0.0.48247334` | Inactive |
| `undelegationContractId` | `0.0.48247333` | Inactive |
| `hbarxTokenId` | `0.0.48247328` | Inactive |
| `treasuryAccountId` | `0.0.48247329` | Inactive |
| `mirrorNodeBaseUrl` | `https://testnet.mirrornode.hedera.com` | Active |

## Official Stader Resources

- Website: https://www.staderlabs.com/hedera/
- CLI tool (source of contract addresses): https://github.com/stader-labs/hbarx-cli
- Hedera Hashscan (staking contract): https://hashscan.io/mainnet/contract/0.0.1027588
