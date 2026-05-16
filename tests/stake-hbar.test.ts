import { describe, expect, it } from "vitest";
import { StakeHbarTool } from "../src/tools/stake-hbar";

const STAKING_CONTRACT = "0.0.1027588";

const makeContext = (stakingContractId?: string) => ({
  config: { stader: { stakingContractId } },
});

const makeClient = () => ({ operatorAccountId: { toString: () => "0.0.999" } });

const baseArgs = { amount_hbar: "100" };

describe("StakeHbarTool.coreAction", () => {
  const tool = new StakeHbarTool();

  it("returns error when staking contract ID is missing", async () => {
    const result = await tool.coreAction(baseArgs, makeContext() as never, makeClient() as never);
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("staking contract") });
  });

  it("returns error for invalid amount", async () => {
    const result = await tool.coreAction(
      { amount_hbar: "abc" },
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("Invalid amount") });
  });

  it("returns error for zero amount", async () => {
    const result = await tool.coreAction(
      { amount_hbar: "0" },
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("Invalid amount") });
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
        amount_hbar: "100",
        staking_contract_id: STAKING_CONTRACT,
      });
    }
  });

  it("returns a core payload for decimal HBAR amount", async () => {
    const result = await tool.coreAction(
      { amount_hbar: "1.5" },
      makeContext(STAKING_CONTRACT) as never,
      makeClient() as never,
    );
    expect(result).toHaveProperty("transaction");
  });
});

describe("StakeHbarTool.shouldSecondaryAction", () => {
  const tool = new StakeHbarTool();

  it("returns true when coreAction produced a transaction payload", async () => {
    expect(await tool.shouldSecondaryAction({ transaction: {}, extras: {} }, {} as never)).toBe(true);
  });

  it("returns false for an error result", async () => {
    expect(await tool.shouldSecondaryAction({ success: false, error: "oops" }, {} as never)).toBe(false);
  });

  it("returns false for null", async () => {
    expect(await tool.shouldSecondaryAction(null, {} as never)).toBe(false);
  });
});
