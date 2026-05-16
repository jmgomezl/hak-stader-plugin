import { BaseTool, type Context } from "@hashgraph/hedera-agent-kit";
import { type Client } from "@hiero-ledger/sdk";
import { z } from "zod";
import { type StaderMirrorClient, createStaderMirrorClient } from "../client";
import { resolveStaderConfig } from "../config";
import { formatUnits } from "../utils/units";

const exchangeRateSchema = z.object({});

type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;

export class GetExchangeRateTool extends BaseTool<ExchangeRateInput, ExchangeRateInput> {
  method = "stader_get_exchange_rate";
  name = "Stader Get HBARX Exchange Rate";
  description =
    "Get the current HBARX exchange rate (HBAR per HBARX) from Stader on Hedera. " +
    "The rate is computed from the protocol treasury balance divided by HBARX total supply. " +
    "Rate > 1 means staking rewards have accrued. Also returns TVL and circulating HBARX supply.";
  parameters = exchangeRateSchema;

  async normalizeParams(
    params: ExchangeRateInput,
    _context: Context,
    _client: Client,
  ): Promise<ExchangeRateInput> {
    return exchangeRateSchema.parse(params);
  }

  async coreAction(_args: ExchangeRateInput, context: Context, _client: Client) {
    const config = resolveStaderConfig(context);

    if (!config.mirrorNodeBaseUrl || !config.treasuryAccountId || !config.hbarxTokenId) {
      return {
        success: false,
        error:
          "Missing mirror node URL, treasury account ID, or HBARX token ID. " +
          "Set STADER_NETWORK or individual env vars.",
      };
    }

    try {
      const mirrorClient: StaderMirrorClient =
        (context as { staderMirrorClient?: StaderMirrorClient }).staderMirrorClient ??
        createStaderMirrorClient(config);

      const [treasuryTinybars, totalSupplyRaw] = await Promise.all([
        mirrorClient.getTreasuryBalanceTinybars(),
        mirrorClient.getHbarxTotalSupplyRaw(),
      ]);

      if (totalSupplyRaw === "0" || totalSupplyRaw === "") {
        return { success: false, error: "HBARX total supply is zero — cannot compute rate." };
      }

      // Both tinybars and raw HBARX units use 8 decimals, so the ratio gives HBAR/HBARX directly.
      // Use BigInt to avoid float precision loss on large balances (>2^53 tinybars).
      const SCALE = BigInt(100_000_000); // 1e8 for 8 decimal places in output
      const treasury = BigInt(treasuryTinybars);
      const supply = BigInt(totalSupplyRaw);
      const rateRaw = (treasury * SCALE) / supply;

      const exchangeRateStr = formatUnits(rateRaw.toString(), 8);
      const totalStakedHbar = formatUnits(treasuryTinybars, 8);
      const totalHbarxSupply = formatUnits(totalSupplyRaw, 8);

      return {
        success: true,
        exchange_rate_hbar_per_hbarx: exchangeRateStr,
        total_staked_hbar: totalStakedHbar,
        total_hbarx_supply: totalHbarxSupply,
        treasury_account_id: config.treasuryAccountId,
        hbarx_token_id: config.hbarxTokenId,
        note:
          "Exchange rate is computed off-chain as treasury_hbar / hbarx_supply. " +
          "The on-chain getExchangeRate() function is deprecated and returns 1.0.",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error fetching exchange rate",
      };
    }
  }

  override async shouldSecondaryAction(_coreActionResult: unknown, _context: Context) {
    return false;
  }

  async secondaryAction(_payload: never, _client: Client, _context: Context) {
    return {};
  }
}

export const getExchangeRateTool = new GetExchangeRateTool();
