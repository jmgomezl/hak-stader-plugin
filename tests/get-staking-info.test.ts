import { describe, expect, it } from "vitest";
import type { StaderContractClient } from "../src/client";
import { GetStakingInfoTool } from "../src/tools/get-staking-info";

const STAKING_CONTRACT = "0.0.1027588";
const UNDELEGATION_CONTRACT = "0.0.1027587";
const HBARX_TOKEN = "0.0.834116";

const makeContext = (contractClient?: StaderContractClient) => ({
  config: {
    stader: {
      stakingContractId: STAKING_CONTRACT,
      undelegationContractId: UNDELEGATION_CONTRACT,
      hbarxTokenId: HBARX_TOKEN,
      network: "mainnet",
    },
  },
  ...(contractClient ? { staderContractClient: contractClient } : {}),
});

const makeClient = () => ({ operatorAccountId: { toString: () => "0.0.999" } });

const normalClient: StaderContractClient = {
  isStakePaused: async () => false,
  isUnstakePaused: async () => false,
  unbondingTime: async () => 86400,
  undelegationsMap: async () => ({ amount: "0", releaseTime: 0 }),
};

const pausedClient: StaderContractClient = {
  isStakePaused: async () => true,
  isUnstakePaused: async () => true,
  unbondingTime: async () => 86400,
  undelegationsMap: async () => ({ amount: "0", releaseTime: 0 }),
};

describe("GetStakingInfoTool.coreAction", () => {
  const tool = new GetStakingInfoTool();

  it("returns error when contract IDs are missing", async () => {
    const ctx = { config: { stader: {} }, staderContractClient: normalClient };
    const result = await tool.coreAction({}, ctx as never, makeClient() as never);
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("contract") });
  });

  it("returns operational status on happy path", async () => {
    const result = await tool.coreAction(
      {},
      makeContext(normalClient) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({
      success: true,
      stake_paused: false,
      unstake_paused: false,
      staking_open: true,
      unstaking_open: true,
      unbonding_time_seconds: 86400,
      unbonding_time_hours: 24,
      staking_contract_id: STAKING_CONTRACT,
      undelegation_contract_id: UNDELEGATION_CONTRACT,
      hbarx_token_id: HBARX_TOKEN,
      network: "mainnet",
    });
  });

  it("reflects paused state correctly", async () => {
    const result = await tool.coreAction(
      {},
      makeContext(pausedClient) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({
      success: true,
      stake_paused: true,
      unstake_paused: true,
      staking_open: false,
      unstaking_open: false,
    });
  });

  it("returns error when contract client throws", async () => {
    const errorClient: StaderContractClient = {
      isStakePaused: async () => {
        throw new Error("RPC connection failed");
      },
      isUnstakePaused: async () => false,
      unbondingTime: async () => 86400,
      undelegationsMap: async () => ({ amount: "0", releaseTime: 0 }),
    };
    const result = await tool.coreAction(
      {},
      makeContext(errorClient) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({
      success: false,
      error: expect.stringContaining("RPC connection failed"),
    });
  });
});

describe("GetStakingInfoTool.shouldSecondaryAction", () => {
  const tool = new GetStakingInfoTool();

  it("always returns false (query tool)", async () => {
    expect(await tool.shouldSecondaryAction({ success: true }, {} as never)).toBe(false);
  });
});
