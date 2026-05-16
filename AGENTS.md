# AGENTS.md — hak-stader-plugin

Guidelines for AI agents (Claude Code, Copilot, etc.) working in this repository.

## Project Overview

`hak-stader-plugin` is a third-party plugin for the [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit-js) (HAK). It integrates [Stader](https://www.staderlabs.com/hedera/) liquid staking on Hedera, allowing agents to stake HBAR and receive HBARX (a yield-bearing liquid staking token).

## Project Structure

```
hak-stader-plugin/
├── src/
│   ├── index.ts              # Public exports
│   ├── plugin.ts             # Plugin definition (tool list)
│   ├── networks.ts           # STADER_MAINNET, STADER_TESTNET constants
│   ├── types.ts              # StaderConfig, PendingWithdrawal interfaces
│   ├── config.ts             # resolveStaderConfig() — env var + context config
│   ├── client.ts             # StaderContractClient, StaderMirrorClient, StaderBalanceQuery
│   └── tools/
│       ├── stake-hbar.ts
│       ├── approve-hbarx.ts
│       ├── unstake-hbarx.ts
│       ├── claim-withdrawal.ts
│       ├── get-pending-withdrawals.ts
│       ├── get-hbarx-balance.ts
│       ├── get-exchange-rate.ts
│       └── get-staking-info.ts
├── tests/                    # Vitest unit tests — one file per tool
├── docs/
│   ├── TOOLS.md
│   ├── CONFIGURATION.md
│   └── EXAMPLES.md
├── dist/                     # Build output (gitignored)
└── package.json
```

## Build Commands

```bash
npm install          # Install dependencies
npm run build        # Compile with tsup (ESM + CJS output)
npm run typecheck    # tsc --noEmit (run before every commit)
npm run lint         # Biome linting
npm run format       # Biome formatting
npm test             # Vitest unit tests
```

**Always run `npm run typecheck` before committing.**

## Coding Style

- TypeScript ESM with `"type": "module"` in package.json
- Biome: 2-space indent, 100-char line width
- No CommonJS source; tsup handles dual output
- No comments except for non-obvious WHY explanations

## Critical Package Names

Use these exact packages — the old names will cause errors:

| Use | Do NOT use |
|-----|-----------|
| `@hashgraph/hedera-agent-kit` | `hedera-agent-kit` |
| `@hiero-ledger/sdk` | `@hashgraph/sdk` |

## Tool Architecture

All tools extend `BaseTool` from `@hashgraph/hedera-agent-kit`:

- **Transaction tools** (`stake`, `approve`, `unstake`, `claim`): `coreAction` builds the transaction object and returns `{ transaction, extras }`. Never submit in `coreAction`. `shouldSecondaryAction` returns `true` when `"transaction" in coreResult`. `secondaryAction` calls `handleTransaction`.

- **Query tools** (`get_*`): `coreAction` fetches data and returns it directly. `shouldSecondaryAction` always returns `false`. `secondaryAction` is a no-op.

- **Error handling**: always return `{ success: false, error: "message" }` — never `throw`.

## Testability Pattern

Query tools that use the Hedera client (ContractCallQuery, AccountBalanceQuery) or HTTP calls (mirror node) check `context` for injected test fakes first:

```typescript
const contractClient =
  (context as { staderContractClient?: StaderContractClient }).staderContractClient ??
  createStaderContractClient(config, client);
```

This allows tests to inject mocks without any real network calls.

## Key Facts — Do Not Change

- **Staking contract**: `0.0.1027588`
- **Undelegation contract**: `0.0.1027587`
- **HBARX token**: `0.0.834116` (HTS, NOT an EVM token)
- **Treasury**: `0.0.1412503`
- **Unbonding period**: 86400 seconds (1 day)
- **HBARX decimals**: 8
- **`getExchangeRate()` is broken** — always returns 1.0. Use mirror node computation instead.
- **Testnet is inactive** — Stader has no live testnet deployment.
- **HTS allowance required before `unStake()`**: use `AccountAllowanceApproveTransaction`, not ERC20 approve.

## Commit Conventions

Use Conventional Commits:

```
feat(tools): add stader_get_user_stats tool
fix(config): handle missing mirrorNodeBaseUrl gracefully
docs: update TOOLS.md with gas estimates
test: add edge case for zero HBARX balance
chore: bump @hiero-ledger/sdk to 2.83.0
```

## Publishing

```bash
npm run build
npm run typecheck
npm test
npm publish
```

Use an **Automation token** from npmjs.com (not Granular — Granular tokens fail 2FA even with publish permission). Provide the token at publish time; revoke immediately after.

## Upstream PR (hashgraph/hedera-agent-kit-js)

1. `gh repo sync jmgomezl/hedera-agent-kit-js --source hashgraph/hedera-agent-kit-js`
2. Create a branch, update `README.md` and `docs/PLUGINS.md`
3. `git commit -s` (DCO sign — required by CNCF)
4. Open PR with `--head jmgomezl:branch-name --base main`
5. The "Assignee Check" CI failure is expected for external contributors — maintainers handle it.
