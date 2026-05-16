export interface StaderConfig {
  network?: "mainnet" | "testnet";
  stakingContractId?: string;
  undelegationContractId?: string;
  hbarxTokenId?: string;
  treasuryAccountId?: string;
  mirrorNodeBaseUrl?: string;
  /** Gas limit for ContractExecuteTransaction calls (default: 2_000_000) */
  gasLimit: number;
  /** Max withdrawal index to poll when enumerating pending withdrawals (default: 20) */
  maxWithdrawalPollingIndex: number;
}

export interface PendingWithdrawal {
  index: number;
  /** Raw HBARX amount in smallest units (8 decimals) */
  amount_hbarx_raw: string;
  /** Human-readable HBARX amount */
  amount_hbarx: string;
  /** Unix timestamp when the withdrawal becomes claimable */
  release_time_unix: number;
  /** Whether the unbonding period has passed */
  claimable: boolean;
  /** Seconds remaining until claimable (0 if already claimable) */
  seconds_remaining: number;
}
