export { staderPlugin } from "./plugin";

export const staderPluginToolNames = {
  STADER_STAKE_HBAR: "stader_stake_hbar",
  STADER_APPROVE_HBARX: "stader_approve_hbarx",
  STADER_UNSTAKE_HBAR: "stader_unstake_hbar",
  STADER_CLAIM_WITHDRAWAL: "stader_claim_withdrawal",
  STADER_GET_PENDING_WITHDRAWALS: "stader_get_pending_withdrawals",
  STADER_GET_HBARX_BALANCE: "stader_get_hbarx_balance",
  STADER_GET_EXCHANGE_RATE: "stader_get_exchange_rate",
  STADER_GET_STAKING_INFO: "stader_get_staking_info",
} as const;

export { STADER_MAINNET, STADER_TESTNET, NETWORK_DEFAULTS } from "./networks";
export type { StaderNetworkDefaults } from "./networks";
export type { StaderConfig, PendingWithdrawal } from "./types";

export { staderPlugin as default } from "./plugin";
