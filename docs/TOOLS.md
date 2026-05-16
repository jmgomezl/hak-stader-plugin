# Stader Plugin — Tool Reference

## `stader_stake_hbar`

Stake HBAR with Stader to receive HBARX (liquid staking token).

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_hbar` | string | Yes | Amount of HBAR to stake (decimal, e.g. `"100"` or `"1.5"`) |

**Returns**

```json
{
  "status": "SUCCESS",
  "transactionId": "0.0.999@1716000000.000000000",
  "amount_hbar": "100",
  "staking_contract_id": "0.0.1027588"
}
```

**Errors**

| Condition | Error message |
|-----------|---------------|
| Missing staking contract ID | `"Missing staking contract ID..."` |
| Invalid or zero amount | `"Invalid amount_hbar: ..."` |

**Example prompts**

- _"Stake 500 HBAR with Stader"_
- _"Liquid stake 100 HBAR to get HBARX"_

---

## `stader_approve_hbarx`

Approve the Stader staking contract to spend HBARX on your behalf (HTS token allowance). **Must be called before `stader_unstake_hbar`.**

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_hbarx` | string | Yes | Amount of HBARX to approve (decimal, e.g. `"100"`). Must be ≥ unstake amount. |

**Returns**

```json
{
  "status": "SUCCESS",
  "transactionId": "0.0.999@1716000000.000000000",
  "amount_hbarx": "100",
  "spender": "0.0.1027588",
  "hbarx_token_id": "0.0.834116"
}
```

**Errors**

| Condition | Error message |
|-----------|---------------|
| No operator account | `"Hedera client with an operator account is required..."` |
| Missing staking contract ID | `"Missing staking contract ID..."` |
| Missing HBARX token ID | `"Missing HBARX token ID..."` |

**Example prompts**

- _"Approve 100 HBARX for unstaking"_
- _"Grant Stader permission to spend 50 HBARX"_

---

## `stader_unstake_hbar`

Initiate unstaking of HBARX. Burns HBARX and begins the 1-day unbonding period. **Requires a prior `stader_approve_hbarx` call.**

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount_hbarx` | string | Yes | Amount of HBARX to unstake (decimal, e.g. `"100"`) |

**Returns**

```json
{
  "status": "SUCCESS",
  "transactionId": "0.0.999@1716000000.000000000",
  "amount_hbarx": "100",
  "amount_hbarx_raw": "10000000000",
  "staking_contract_id": "0.0.1027588"
}
```

**Errors**

| Condition | Error message |
|-----------|---------------|
| Missing staking contract ID | `"Missing staking contract ID..."` |
| Invalid amount | `"Invalid amount format: ..."` |
| Missing HBARX allowance | Contract reverts (approve first) |

**Example prompts**

- _"Unstake 100 HBARX from Stader"_
- _"Begin HBAR unstaking process for 50 HBARX"_

---

## `stader_claim_withdrawal`

Claim HBAR from a completed unstake request after the 1-day unbonding period.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `withdrawal_index` | integer | Yes | 0-based index of the withdrawal to claim (from `stader_get_pending_withdrawals`) |

**Returns**

```json
{
  "status": "SUCCESS",
  "transactionId": "0.0.999@1716000000.000000000",
  "withdrawal_index": 0,
  "undelegation_contract_id": "0.0.1027587"
}
```

**Errors**

| Condition | Error message |
|-----------|---------------|
| Missing undelegation contract ID | `"Missing undelegation contract ID..."` |
| Claiming too early | Contract reverts (unbonding not complete) |

**Example prompts**

- _"Claim my Stader withdrawal"_
- _"Withdraw my HBAR from Stader unstake index 0"_

---

## `stader_get_pending_withdrawals`

List all pending HBARX withdrawal requests for a Hedera account.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account_id` | string | Yes | Hedera account ID (e.g. `"0.0.12345"`) |

**Returns**

```json
{
  "success": true,
  "account_id": "0.0.12345",
  "withdrawals": [
    {
      "index": 0,
      "amount_hbarx_raw": "10000000000",
      "amount_hbarx": "100",
      "release_time_unix": 1716086400,
      "claimable": true,
      "seconds_remaining": 0
    }
  ],
  "total_pending": 1,
  "claimable_count": 1
}
```

**Example prompts**

- _"Show my pending Stader withdrawals"_
- _"Check if my HBAR unstake is ready to claim"_

---

## `stader_get_hbarx_balance`

Get the HBARX token balance for a Hedera account.

**Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `account_id` | string | No | Hedera account ID. Defaults to operator account. |

**Returns**

```json
{
  "success": true,
  "account_id": "0.0.12345",
  "hbarx_token_id": "0.0.834116",
  "hbarx_balance_raw": "10000000000",
  "hbarx_balance": "100"
}
```

**Example prompts**

- _"What is my HBARX balance?"_
- _"How much HBARX does account 0.0.12345 hold?"_

---

## `stader_get_exchange_rate`

Get the current HBARX/HBAR exchange rate computed from on-chain treasury data.

> **Note:** The on-chain `getExchangeRate()` function is deprecated (always returns 1.0). This tool computes the real rate from `treasury_hbar / hbarx_supply` via the Hedera Mirror Node.

**Parameters**

None.

**Returns**

```json
{
  "success": true,
  "exchange_rate_hbar_per_hbarx": "1.40123456",
  "total_staked_hbar": "450000000",
  "total_hbarx_supply": "320000000",
  "treasury_account_id": "0.0.1412503",
  "hbarx_token_id": "0.0.834116",
  "note": "Exchange rate is computed off-chain..."
}
```

**Example prompts**

- _"What is the current HBARX exchange rate?"_
- _"How much HBAR will I get per HBARX?"_
- _"What is the total HBAR staked with Stader?"_

---

## `stader_get_staking_info`

Get current Stader protocol status: paused state, unbonding duration, and contract addresses.

**Parameters**

None.

**Returns**

```json
{
  "success": true,
  "stake_paused": false,
  "unstake_paused": false,
  "staking_open": true,
  "unstaking_open": true,
  "unbonding_time_seconds": 86400,
  "unbonding_time_hours": 24,
  "staking_contract_id": "0.0.1027588",
  "undelegation_contract_id": "0.0.1027587",
  "hbarx_token_id": "0.0.834116",
  "network": "mainnet"
}
```

**Example prompts**

- _"Is Stader staking currently available?"_
- _"How long is the Stader unbonding period?"_
- _"Check Stader protocol status before I stake"_
