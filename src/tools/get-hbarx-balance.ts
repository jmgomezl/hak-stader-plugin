import { BaseTool, type Context } from "@hashgraph/hedera-agent-kit";
import { type Client } from "@hiero-ledger/sdk";
import { z } from "zod";
import { type StaderBalanceQuery, createStaderBalanceQuery } from "../client";
import { resolveStaderConfig } from "../config";
import { formatUnits } from "../utils/units";

const HBARX_DECIMALS = 8;

const balanceSchema = z.object({
  account_id: z
    .string()
    .optional()
    .describe(
      "Hedera account ID to check HBARX balance for (e.g. '0.0.12345'). " +
        "Defaults to the operator account if omitted.",
    ),
});

type BalanceInput = z.infer<typeof balanceSchema>;

export class GetHbarxBalanceTool extends BaseTool<BalanceInput, BalanceInput> {
  method = "stader_get_hbarx_balance";
  name = "Stader Get HBARX Balance";
  description =
    "Get the HBARX token balance for a Hedera account. " +
    "HBARX is the liquid staking token received when staking HBAR with Stader. " +
    "Returns both the raw (smallest unit) and human-readable balance.";
  parameters = balanceSchema;

  async normalizeParams(
    params: BalanceInput,
    _context: Context,
    _client: Client,
  ): Promise<BalanceInput> {
    return balanceSchema.parse(params);
  }

  async coreAction(args: BalanceInput, context: Context, client: Client) {
    const config = resolveStaderConfig(context);
    const accountId = args.account_id ?? client?.operatorAccountId?.toString();

    if (!accountId) {
      return {
        success: false,
        error: "No account_id provided and no operator account on client.",
      };
    }
    if (!config.hbarxTokenId) {
      return {
        success: false,
        error: "Missing HBARX token ID. Set STADER_HBARX_TOKEN_ID or pass network in config.",
      };
    }

    try {
      const balanceQuery: StaderBalanceQuery =
        (context as { staderBalanceQuery?: StaderBalanceQuery }).staderBalanceQuery ??
        createStaderBalanceQuery(config, client);

      const rawBalance = await balanceQuery.getHbarxBalance(accountId);

      if (rawBalance === null) {
        return {
          success: true,
          account_id: accountId,
          hbarx_token_id: config.hbarxTokenId,
          hbarx_balance_raw: "0",
          hbarx_balance: "0",
          note: "Account has no HBARX balance or token is not associated.",
        };
      }

      return {
        success: true,
        account_id: accountId,
        hbarx_token_id: config.hbarxTokenId,
        hbarx_balance_raw: rawBalance,
        hbarx_balance: formatUnits(rawBalance, HBARX_DECIMALS),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error fetching HBARX balance",
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

export const getHbarxBalanceTool = new GetHbarxBalanceTool();
