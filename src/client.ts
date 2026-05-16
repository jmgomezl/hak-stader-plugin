import {
  AccountBalanceQuery,
  AccountId,
  ContractCallQuery,
  ContractFunctionParameters,
  TokenId,
} from "@hiero-ledger/sdk";
import type { Client } from "@hiero-ledger/sdk";
import type { StaderConfig } from "./types";
import { uint256Arg } from "./utils/units";

export interface StaderContractClient {
  isStakePaused(): Promise<boolean>;
  isUnstakePaused(): Promise<boolean>;
  unbondingTime(): Promise<number>;
  undelegationsMap(
    evmAddress: string,
    index: number,
  ): Promise<{ amount: string; releaseTime: number }>;
}

export interface StaderMirrorClient {
  getTreasuryBalanceTinybars(): Promise<string>;
  getHbarxTotalSupplyRaw(): Promise<string>;
}

export interface StaderBalanceQuery {
  getHbarxBalance(accountId: string): Promise<string | null>;
}

export const createStaderContractClient = (
  config: StaderConfig,
  client: Client,
): StaderContractClient => ({
  isStakePaused: async () => {
    const result = await new ContractCallQuery()
      .setContractId(config.stakingContractId!)
      .setGas(100_000)
      .setFunction("isStakePaused")
      .execute(client);
    return result.getBool(0);
  },

  isUnstakePaused: async () => {
    const result = await new ContractCallQuery()
      .setContractId(config.stakingContractId!)
      .setGas(100_000)
      .setFunction("isUnstakePaused")
      .execute(client);
    return result.getBool(0);
  },

  unbondingTime: async () => {
    const result = await new ContractCallQuery()
      .setContractId(config.undelegationContractId!)
      .setGas(100_000)
      .setFunction("unbondingTime")
      .execute(client);
    return result.getUint256(0).toNumber();
  },

  undelegationsMap: async (evmAddress: string, index: number) => {
    const params = new ContractFunctionParameters()
      .addAddress(evmAddress)
      .addUint256(uint256Arg(index));
    const result = await new ContractCallQuery()
      .setContractId(config.undelegationContractId!)
      .setGas(100_000)
      .setFunction("undelegationsMap", params)
      .execute(client);
    return {
      amount: result.getUint256(0).toString(),
      releaseTime: result.getUint256(1).toNumber(),
    };
  },
});

export const createStaderMirrorClient = (config: StaderConfig): StaderMirrorClient => ({
  getTreasuryBalanceTinybars: async () => {
    const url = `${config.mirrorNodeBaseUrl}/api/v1/accounts/${config.treasuryAccountId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mirror node error ${res.status} fetching treasury balance`);
    const data = (await res.json()) as { balance: { balance: number } };
    return String(data.balance.balance);
  },

  getHbarxTotalSupplyRaw: async () => {
    const url = `${config.mirrorNodeBaseUrl}/api/v1/tokens/${config.hbarxTokenId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mirror node error ${res.status} fetching HBARX supply`);
    const data = (await res.json()) as { total_supply: string };
    return data.total_supply;
  },
});

export const createStaderBalanceQuery = (
  config: StaderConfig,
  client: Client,
): StaderBalanceQuery => ({
  getHbarxBalance: async (accountId: string) => {
    const balance = await new AccountBalanceQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);
    if (!balance.tokens || !config.hbarxTokenId) return null;
    const hbarxLong = balance.tokens.get(TokenId.fromString(config.hbarxTokenId));
    return hbarxLong ? hbarxLong.toString() : null;
  },
});
