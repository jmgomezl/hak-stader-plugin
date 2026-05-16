import { describe, expect, it } from "vitest";
import { UnstakeHbarxTool } from "../src/tools/unstake-hbarx";

const STAKING_CONTRACT = "0.0.1027588";

const makeContext = (stakingContractId?: string) => ({
  config: { stader: { stakingContractId } },
});

const makeClient = () => ({ operatorAccountId: { toString: () => "0.0.999" } });

const baseArgs = { amount_hbarx: "50" };

describe("UnstakeHbarxTool.coreAction", () => {
  const tool = new UnstakeHbarxTool();

  it("returns error when staking contract ID is missing", async () => {
    const result = await tool.coreAction(baseArgs, makeContext() as never, makeClient() as never);
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("staking contract") });
  });

  it("returns error for invalid amount format", async () => {
    const result = await tool.coreAction(
      { amount_hbarx: "bad-value" },
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false });
  });

  it("returns error for too many decimal places", async () => {
    const result = await tool.coreAction(
      { amount_hbarx: "1.123456789" }, // 9 decimal places, max is 8
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false });
  });

  it("returns a core payload with a transaction on happy path", async () => {
    const result = await tool.coreAction(
      baseArgs,
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toHaveProperty("transaction");
    expect(result).toHaveProperty("extras");
    if ("extras" in result) {
      expect(result.extras).toMatchObject({
        amount_hbarx: "50",
        amount_hbarx_raw: "5000000000",
        staking_contract_id: STAKING_CONTRACT,
      });
    }
  });

  it("converts decimal HBARX amount to raw units correctly", async () => {
    const result = await tool.coreAction(
      { amount_hbarx: "1.5" },
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toHaveProperty("transaction");
    if ("extras" in result) {
      expect(result.extras).toMatchObject({ amount_hbarx_raw: "150000000" });
    }
  });
});

describe("UnstakeHbarxTool.shouldSecondaryAction", () => {
  const tool = new UnstakeHbarxTool();

  it("returns true for a transaction payload", async () => {
    expect(await tool.shouldSecondaryAction({ transaction: {}, extras: {} }, {} as never)).toBe(true);
  });

  it("returns false for an error result", async () => {
    expect(await tool.shouldSecondaryAction({ success: false, error: "oops" }, {} as never)).toBe(false);
  });
});
