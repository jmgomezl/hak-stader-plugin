import { describe, expect, it } from "vitest";
import { ApproveHbarxTool } from "../src/tools/approve-hbarx";

const STAKING_CONTRACT = "0.0.1027588";
const HBARX_TOKEN = "0.0.834116";
const OPERATOR = "0.0.999";

const makeContext = (overrides: { stakingContractId?: string; hbarxTokenId?: string } = {}) => ({
  config: {
    stader: {
      stakingContractId: STAKING_CONTRACT,
      hbarxTokenId: HBARX_TOKEN,
      ...overrides,
    },
  },
});

const makeClient = (accountId?: string) => ({
  operatorAccountId: accountId ? { toString: () => accountId } : null,
});

const baseArgs = { amount_hbarx: "100" };

describe("ApproveHbarxTool.coreAction", () => {
  const tool = new ApproveHbarxTool();

  it("returns error when client has no operator account", async () => {
    const result = await tool.coreAction(
      baseArgs,
      makeContext() as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("operator account") });
  });

  it("returns error when staking contract ID is missing", async () => {
    const result = await tool.coreAction(
      baseArgs,
      makeContext({ stakingContractId: undefined }) as never,
      makeClient(OPERATOR) as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("staking contract") });
  });

  it("returns error when HBARX token ID is missing", async () => {
    const result = await tool.coreAction(
      baseArgs,
      makeContext({ hbarxTokenId: undefined }) as never,
      makeClient(OPERATOR) as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("HBARX token") });
  });

  it("returns error for invalid amount format", async () => {
    const result = await tool.coreAction(
      { amount_hbarx: "not-a-number" },
      makeContext() as never,
      makeClient(OPERATOR) as never,
    );
    expect(result).toMatchObject({ success: false });
  });

  it("returns a core payload with a transaction on happy path", async () => {
    const result = await tool.coreAction(baseArgs, makeContext() as never, makeClient(OPERATOR) as never);
    expect(result).toHaveProperty("transaction");
    expect(result).toHaveProperty("extras");
    if ("extras" in result) {
      expect(result.extras).toMatchObject({
        amount_hbarx: "100",
        spender: STAKING_CONTRACT,
        hbarx_token_id: HBARX_TOKEN,
      });
    }
  });
});

describe("ApproveHbarxTool.shouldSecondaryAction", () => {
  const tool = new ApproveHbarxTool();

  it("returns true for a transaction payload", async () => {
    expect(await tool.shouldSecondaryAction({ transaction: {}, extras: {} }, {} as never)).toBe(true);
  });

  it("returns false for an error result", async () => {
    expect(await tool.shouldSecondaryAction({ success: false, error: "oops" }, {} as never)).toBe(false);
  });
});
