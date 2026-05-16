import { describe, expect, it } from "vitest";
import { GetPendingWithdrawalsTool } from "../src/tools/get-pending-withdrawals";
import type { StaderContractClient } from "../src/client";

const UNDELEGATION_CONTRACT = "0.0.1027587";
const ACCOUNT_ID = "0.0.12345";

const nowSeconds = () => Math.floor(Date.now() / 1000);

const makeContext = (contractClient?: Partial<StaderContractClient>) => ({
  config: { stader: { undelegationContractId: UNDELEGATION_CONTRACT } },
  ...(contractClient ? { staderContractClient: contractClient } : {}),
});

const makeClient = () => ({ operatorAccountId: { toString: () => "0.0.999" } });

const emptyContractClient: StaderContractClient = {
  isStakePaused: async () => false,
  isUnstakePaused: async () => false,
  unbondingTime: async () => 86400,
  undelegationsMap: async (_addr, _idx) => ({ amount: "0", releaseTime: 0 }),
};

const oneWithdrawalClient: StaderContractClient = {
  isStakePaused: async () => false,
  isUnstakePaused: async () => false,
  unbondingTime: async () => 86400,
  undelegationsMap: async (_addr, idx) => {
    if (idx === 0) return { amount: "10000000000", releaseTime: nowSeconds() - 100 };
    return { amount: "0", releaseTime: 0 };
  },
};

const futureWithdrawalClient: StaderContractClient = {
  isStakePaused: async () => false,
  isUnstakePaused: async () => false,
  unbondingTime: async () => 86400,
  undelegationsMap: async (_addr, idx) => {
    if (idx === 0) return { amount: "5000000000", releaseTime: nowSeconds() + 3600 };
    return { amount: "0", releaseTime: 0 };
  },
};

describe("GetPendingWithdrawalsTool.coreAction", () => {
  const tool = new GetPendingWithdrawalsTool();

  it("returns error when undelegation contract ID is missing", async () => {
    const ctx = { config: { stader: {} } };
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      ctx as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("undelegation contract") });
  });

  it("returns empty withdrawals list when no pending withdrawals exist", async () => {
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      makeContext(emptyContractClient) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: true, withdrawals: [], total_pending: 0, claimable_count: 0 });
  });

  it("returns a claimable withdrawal when release time has passed", async () => {
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      makeContext(oneWithdrawalClient) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: true, total_pending: 1, claimable_count: 1 });
    if ("withdrawals" in result && Array.isArray(result.withdrawals)) {
      expect(result.withdrawals[0]).toMatchObject({
        index: 0,
        amount_hbarx: "100",
        claimable: true,
        seconds_remaining: 0,
      });
    }
  });

  it("returns a non-claimable withdrawal when still in unbonding period", async () => {
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      makeContext(futureWithdrawalClient) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: true, total_pending: 1, claimable_count: 0 });
    if ("withdrawals" in result && Array.isArray(result.withdrawals)) {
      expect(result.withdrawals[0]).toMatchObject({ claimable: false });
      expect((result.withdrawals[0] as { seconds_remaining: number }).seconds_remaining).toBeGreaterThan(0);
    }
  });
});

describe("GetPendingWithdrawalsTool.shouldSecondaryAction", () => {
  const tool = new GetPendingWithdrawalsTool();

  it("always returns false (query tool)", async () => {
    expect(await tool.shouldSecondaryAction({ success: true }, {} as never)).toBe(false);
    expect(await tool.shouldSecondaryAction({ transaction: {} }, {} as never)).toBe(false);
  });
});
