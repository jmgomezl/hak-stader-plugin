import { describe, expect, it } from "vitest";
import type { StaderBalanceQuery } from "../src/client";
import { GetHbarxBalanceTool } from "../src/tools/get-hbarx-balance";

const HBARX_TOKEN = "0.0.834116";
const ACCOUNT_ID = "0.0.12345";
const OPERATOR = "0.0.999";

const makeContext = (balanceQuery?: StaderBalanceQuery) => ({
  config: { stader: { hbarxTokenId: HBARX_TOKEN } },
  ...(balanceQuery ? { staderBalanceQuery: balanceQuery } : {}),
});

const makeClient = (accountId?: string) => ({
  operatorAccountId: accountId ? { toString: () => accountId } : null,
});

describe("GetHbarxBalanceTool.coreAction", () => {
  const tool = new GetHbarxBalanceTool();

  it("returns error when no account_id and no operator", async () => {
    const result = await tool.coreAction({}, makeContext() as never, makeClient() as never);
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("account_id") });
  });

  it("returns error when HBARX token ID is missing", async () => {
    const ctx = { config: { stader: {} } };
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      ctx as never,
      makeClient(OPERATOR) as never,
    );
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("HBARX token") });
  });

  it("returns zero balance when token is not associated", async () => {
    const balanceQuery: StaderBalanceQuery = { getHbarxBalance: async () => null };
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      makeContext(balanceQuery) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({
      success: true,
      hbarx_balance: "0",
      hbarx_balance_raw: "0",
    });
  });

  it("returns formatted balance on happy path", async () => {
    const balanceQuery: StaderBalanceQuery = {
      getHbarxBalance: async () => "10000000000", // 100 HBARX
    };
    const result = await tool.coreAction(
      { account_id: ACCOUNT_ID },
      makeContext(balanceQuery) as never,
      makeClient() as never,
    );
    expect(result).toMatchObject({
      success: true,
      account_id: ACCOUNT_ID,
      hbarx_balance: "100",
      hbarx_balance_raw: "10000000000",
    });
  });

  it("uses operator account when account_id is omitted", async () => {
    const balanceQuery: StaderBalanceQuery = {
      getHbarxBalance: async (id) => (id === OPERATOR ? "500000000" : null),
    };
    const result = await tool.coreAction(
      {},
      makeContext(balanceQuery) as never,
      makeClient(OPERATOR) as never,
    );
    expect(result).toMatchObject({ success: true, account_id: OPERATOR, hbarx_balance: "5" });
  });
});

describe("GetHbarxBalanceTool.shouldSecondaryAction", () => {
  const tool = new GetHbarxBalanceTool();

  it("always returns false (query tool)", async () => {
    expect(await tool.shouldSecondaryAction({ success: true }, {} as never)).toBe(false);
  });
});
