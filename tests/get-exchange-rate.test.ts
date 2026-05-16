import { describe, expect, it } from "vitest";
import { GetExchangeRateTool } from "../src/tools/get-exchange-rate";
import type { StaderMirrorClient } from "../src/client";

const TREASURY = "0.0.1412503";
const HBARX_TOKEN = "0.0.834116";

const makeContext = (mirrorClient?: StaderMirrorClient) => ({
  config: {
    stader: {
      mirrorNodeBaseUrl: "https://mainnet-public.mirrornode.hedera.com",
      treasuryAccountId: TREASURY,
      hbarxTokenId: HBARX_TOKEN,
    },
  },
  ...(mirrorClient ? { staderMirrorClient: mirrorClient } : {}),
});

const makeClient = () => ({ operatorAccountId: { toString: () => "0.0.999" } });

const makeMirrorClient = (
  treasuryTinybars: string,
  totalSupplyRaw: string,
): StaderMirrorClient => ({
  getTreasuryBalanceTinybars: async () => treasuryTinybars,
  getHbarxTotalSupplyRaw: async () => totalSupplyRaw,
});

describe("GetExchangeRateTool.coreAction", () => {
  const tool = new GetExchangeRateTool();

  it("returns error when config is missing mirror node URL", async () => {
    const ctx = { config: { stader: {} } };
    const result = await tool.coreAction({}, ctx as never, makeClient() as never);
    expect(result).toMatchObject({ success: false });
  });

  it("returns error when total supply is zero", async () => {
    const mirrorClient = makeMirrorClient("45000000000000000", "0");
    const result = await tool.coreAction({}, makeContext(mirrorClient) as never, makeClient() as never);
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("zero") });
  });

  it("returns 1.0 rate when treasury equals supply (in base units)", async () => {
    // 100 HBAR treasury = 10000000000 tinybars, 100 HBARX supply = 10000000000 raw units
    const mirrorClient = makeMirrorClient("10000000000", "10000000000");
    const result = await tool.coreAction({}, makeContext(mirrorClient) as never, makeClient() as never);
    expect(result).toMatchObject({
      success: true,
      exchange_rate_hbar_per_hbarx: "1",
    });
  });

  it("returns correct rate when treasury > supply (rewards accrued)", async () => {
    // 140 HBAR treasury, 100 HBARX supply → rate = 1.4
    const mirrorClient = makeMirrorClient("14000000000", "10000000000");
    const result = await tool.coreAction({}, makeContext(mirrorClient) as never, makeClient() as never);
    expect(result).toMatchObject({ success: true, exchange_rate_hbar_per_hbarx: "1.4" });
  });

  it("returns TVL and supply in human-readable format", async () => {
    // 450M HBAR = 45000000000000000 tinybars; 320M HBARX = 32000000000000000 raw
    const mirrorClient = makeMirrorClient("45000000000000000", "32000000000000000");
    const result = await tool.coreAction({}, makeContext(mirrorClient) as never, makeClient() as never);
    expect(result).toMatchObject({
      success: true,
      total_staked_hbar: "450000000",
      total_hbarx_supply: "320000000",
    });
  });

  it("returns error when mirror client throws", async () => {
    const mirrorClient: StaderMirrorClient = {
      getTreasuryBalanceTinybars: async () => { throw new Error("mirror node down"); },
      getHbarxTotalSupplyRaw: async () => "0",
    };
    const result = await tool.coreAction({}, makeContext(mirrorClient) as never, makeClient() as never);
    expect(result).toMatchObject({ success: false, error: expect.stringContaining("mirror node down") });
  });
});

describe("GetExchangeRateTool.shouldSecondaryAction", () => {
  const tool = new GetExchangeRateTool();

  it("always returns false (query tool)", async () => {
    expect(await tool.shouldSecondaryAction({ success: true }, {} as never)).toBe(false);
  });
});
