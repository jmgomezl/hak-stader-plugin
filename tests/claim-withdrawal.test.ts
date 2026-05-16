import { describe, expect, it } from "vitest";
import { ClaimWithdrawalTool } from "../src/tools/claim-withdrawal";

const UNDELEGATION_CONTRACT = "0.0.1027587";

const makeContext = (undelegationContractId?: string) => ({
  config: { stader: { undelegationContractId } },
});

const makeClient = () => ({ operatorAccountId: { toString: () => "0.0.999" } });

describe("ClaimWithdrawalTool.coreAction", () => {
  const tool = new ClaimWithdrawalTool();

  it("returns error when undelegation contract ID is missing", async () => {
    const result = await tool.coreAction(
      { withdrawal_index: 0 },
      makeContext() as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("undelegation contract") });
  });

  it("returns a core payload for index 0 on happy path", async () => {
    const result = await tool.coreAction(
      { withdrawal_index: 0 },
      makeContext(UNDELEGATION_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toHaveProperty("transaction");
    expect(result).toHaveProperty("extras");
    if ("extras" in result) {
      expect(result.extras).toMatchObject({
        withdrawal_index: 0,
        undelegation_contract_id: UNDELEGATION_CONTRACT,
      });
    }
  });

  it("returns a core payload for index 3", async () => {
    const result = await tool.coreAction(
      { withdrawal_index: 3 },
      makeContext(UNDELEGATION_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toHaveProperty("transaction");
    if ("extras" in result) {
      expect(result.extras).toMatchObject({ withdrawal_index: 3 });
    }
  });
});

describe("ClaimWithdrawalTool.shouldSecondaryAction", () => {
  const tool = new ClaimWithdrawalTool();

  it("returns true for a transaction payload", async () => {
    expect(await tool.shouldSecondaryAction({ transaction: {}, extras: {} }, {} as never)).toBe(true);
  });

  it("returns false for an error result", async () => {
    expect(await tool.shouldSecondaryAction({ success: false, error: "oops" }, {} as never)).toBe(false);
  });
});
