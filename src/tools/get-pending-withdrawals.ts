import { BaseTool, type Context } from "@hashgraph/hedera-agent-kit";
import { AccountId, type Client } from "@hiero-ledger/sdk";
import { z } from "zod";
import {
  type StaderContractClient,
  createStaderContractClient,
} from "../client";
import { resolveStaderConfig } from "../config";
import type { PendingWithdrawal } from "../types";
import { formatUnits } from "../utils/units";

const HBARX_DECIMALS = 8;

const pendingSchema = z.object({
  account_id: z
    .string()
    .describe("Hedera account ID to check pending withdrawals for (e.g. '0.0.12345')"),
});

type PendingInput = z.infer<typeof pendingSchema>;

export class GetPendingWithdrawalsTool extends BaseTool<PendingInput, PendingInput> {
  method = "stader_get_pending_withdrawals";
  name = "Stader Get Pending Withdrawals";
  description =
    "Get all pending HBARX withdrawal requests for a Hedera account. " +
    "Returns the list of withdrawals with their index, amount, release time, and whether they are claimable. " +
    "Use the index from claimable entries to call stader_claim_withdrawal.";
  parameters = pendingSchema;

  async normalizeParams(
    params: PendingInput,
    _context: Context,
    _client: Client,
  ): Promise<PendingInput> {
    return pendingSchema.parse(params);
  }

  async coreAction(args: PendingInput, context: Context, client: Client) {
    const config = resolveStaderConfig(context);

    if (!config.undelegationContractId) {
      return {
        success: false,
        error:
          "Missing undelegation contract ID. Set STADER_UNDELEGATION_CONTRACT_ID or pass network in config.",
      };
    }

    try {
      const evmAddress = AccountId.fromString(args.account_id).toSolidityAddress();

      const contractClient: StaderContractClient =
        (context as { staderContractClient?: StaderContractClient }).staderContractClient ??
        createStaderContractClient(config, client);

      const withdrawals: PendingWithdrawal[] = [];
      const nowSeconds = Math.floor(Date.now() / 1000);

      for (let i = 0; i < config.maxWithdrawalPollingIndex; i++) {
        const entry = await contractClient.undelegationsMap(evmAddress, i);
        if (entry.amount === "0" || entry.amount === "") break;

        const secondsRemaining = Math.max(0, entry.releaseTime - nowSeconds);
        withdrawals.push({
          index: i,
          amount_hbarx_raw: entry.amount,
          amount_hbarx: formatUnits(entry.amount, HBARX_DECIMALS),
          release_time_unix: entry.releaseTime,
          claimable: entry.releaseTime <= nowSeconds,
          seconds_remaining: secondsRemaining,
        });
      }

      return {
        success: true,
        account_id: args.account_id,
        withdrawals,
        total_pending: withdrawals.length,
        claimable_count: withdrawals.filter((w) => w.claimable).length,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error fetching pending withdrawals",
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

export const getPendingWithdrawalsTool = new GetPendingWithdrawalsTool();
