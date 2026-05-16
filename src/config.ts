import { NETWORK_DEFAULTS, type StaderNetworkDefaults } from "./networks";
import type { StaderConfig } from "./types";

const DEFAULT_CONFIG = {
  gasLimit: 2_000_000,
  maxWithdrawalPollingIndex: 20,
} as const;

const readNetwork = (value: string | undefined): "mainnet" | "testnet" | undefined => {
  if (value === "mainnet" || value === "testnet") return value;
  return undefined;
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const readContextConfig = (context: unknown): Partial<StaderConfig> => {
  if (!context || typeof context !== "object") return {};
  const ctx = context as {
    config?: { stader?: Partial<StaderConfig> };
    pluginConfig?: { stader?: Partial<StaderConfig> };
  };
  return {
    ...(ctx.pluginConfig?.stader ?? {}),
    ...(ctx.config?.stader ?? {}),
  };
};

export const resolveStaderConfig = (context?: unknown): StaderConfig => {
  const ctxConfig = readContextConfig(context);
  const network = ctxConfig.network ?? readNetwork(process.env["STADER_NETWORK"]);
  const networkDefaults: Partial<StaderNetworkDefaults> = network ? (NETWORK_DEFAULTS[network] ?? {}) : {};

  return {
    ...DEFAULT_CONFIG,
    ...ctxConfig,
    network,
    stakingContractId:
      ctxConfig.stakingContractId ??
      process.env["STADER_STAKING_CONTRACT_ID"] ??
      networkDefaults.stakingContractId,
    undelegationContractId:
      ctxConfig.undelegationContractId ??
      process.env["STADER_UNDELEGATION_CONTRACT_ID"] ??
      networkDefaults.undelegationContractId,
    hbarxTokenId:
      ctxConfig.hbarxTokenId ??
      process.env["STADER_HBARX_TOKEN_ID"] ??
      networkDefaults.hbarxTokenId,
    treasuryAccountId:
      ctxConfig.treasuryAccountId ??
      process.env["STADER_TREASURY_ACCOUNT_ID"] ??
      networkDefaults.treasuryAccountId,
    mirrorNodeBaseUrl:
      ctxConfig.mirrorNodeBaseUrl ??
      process.env["STADER_MIRROR_NODE_BASE_URL"] ??
      networkDefaults.mirrorNodeBaseUrl,
    gasLimit: ctxConfig.gasLimit ?? toNumber(process.env["STADER_GAS_LIMIT"], DEFAULT_CONFIG.gasLimit),
    maxWithdrawalPollingIndex:
      ctxConfig.maxWithdrawalPollingIndex ??
      toNumber(process.env["STADER_MAX_WITHDRAWAL_INDEX"], DEFAULT_CONFIG.maxWithdrawalPollingIndex),
  };
};
