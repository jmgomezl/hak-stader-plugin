export interface StaderNetworkDefaults {
  /** Hedera contract ID for the staking contract */
  stakingContractId: string;
  /** Hedera contract ID for the undelegation/withdrawal contract */
  undelegationContractId: string;
  /** HTS token ID of HBARX (liquid staking token) */
  hbarxTokenId: string;
  /** Treasury account that holds staked HBAR on behalf of the protocol */
  treasuryAccountId: string;
  /** Hedera Mirror Node base URL for this network */
  mirrorNodeBaseUrl: string;
}

/**
 * Official Stader contract addresses on Hedera Mainnet.
 * Source: https://github.com/stader-labs/hbarx-cli — verified against Hedera Mirror Node.
 */
export const STADER_MAINNET: StaderNetworkDefaults = {
  stakingContractId: "0.0.1027588",
  undelegationContractId: "0.0.1027587",
  hbarxTokenId: "0.0.834116",
  treasuryAccountId: "0.0.1412503",
  mirrorNodeBaseUrl: "https://mainnet-public.mirrornode.hedera.com",
};

/**
 * Stader testnet addresses — NOTE: Stader does not maintain an active testnet deployment.
 * These IDs exist in the official CLI source but are no longer functional on the current
 * Hedera testnet. Use mainnet for all testing or deploy mock contracts manually.
 */
export const STADER_TESTNET: StaderNetworkDefaults = {
  stakingContractId: "0.0.48247334",
  undelegationContractId: "0.0.48247333",
  hbarxTokenId: "0.0.48247328",
  treasuryAccountId: "0.0.48247329",
  mirrorNodeBaseUrl: "https://testnet.mirrornode.hedera.com",
};

export const NETWORK_DEFAULTS: Record<string, StaderNetworkDefaults> = {
  mainnet: STADER_MAINNET,
  testnet: STADER_TESTNET,
};
