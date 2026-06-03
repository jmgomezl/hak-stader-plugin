import {
  BaseTool,
  type Context,
  type RawTransactionResponse,
  handleTransaction,
} from "@hashgraph/hedera-agent-kit";
import {
  AccountAllowanceApproveTransaction,
  AccountId,
  type Client,
  TokenId,
  type Transaction,
} from "@hiero-ledger/sdk";
import { z } from "zod";
import { resolveStaderConfig } from "../config";
import { parseUnits } from "../utils/units";

const HBARX_DECIMALS = 8;

const approveSchema = z.object({
  amount_hbarx: z
    .string()
    .describe(
      "Amount of HBARX to approve for unstaking (decimal format, e.g. '100' or '1.5'). " +
        "Must be >= the amount you plan to unstake.",
    ),
});

type ApproveInput = z.infer<typeof approveSchema>;

type ApproveCorePayload = {
  transaction: Transaction;
  extras: { amount_hbarx: string; spender: string; hbarx_token_id: string };
};

const isApproveCorePayload = (value: unknown): value is ApproveCorePayload =>
  typeof value === "object" && value !== null && "transaction" in value;

const approvePostProcess = (response: RawTransactionResponse) =>
  `HBARX allowance approved. Status: ${response.status}. Transaction ID: ${response.transactionId}`;

export class ApproveHbarxTool extends BaseTool<ApproveInput, ApproveInput> {
  method = "stader_approve_hbarx";
  name = "Stader Approve HBARX for Unstaking";
  description =
    "Approve the Stader staking contract to spend HBARX tokens on your behalf. " +
    "This HTS token allowance MUST be granted before calling stader_unstake_hbarx. " +
    "Approve at least the amount you plan to unstake.";
  parameters = approveSchema;

  async normalizeParams(
    params: ApproveInput,
    _context: Context,
    _client: Client,
  ): Promise<ApproveInput> {
    return approveSchema.parse(params);
  }

  async coreAction(args: ApproveInput, context: Context, client: Client) {
    const config = resolveStaderConfig(context);
    const operatorAccountId = client?.operatorAccountId?.toString();

    if (!operatorAccountId) {
      return {
        success: false,
        error: "Hedera client with an operator account is required to approve HBARX.",
      };
    }
    if (!config.stakingContractId) {
      return {
        success: false,
        error:
          "Missing staking contract ID. Set STADER_STAKING_CONTRACT_ID or pass network in config.",
      };
    }
    if (!config.hbarxTokenId) {
      return {
        success: false,
        error: "Missing HBARX token ID. Set STADER_HBARX_TOKEN_ID or pass network in config.",
      };
    }

    try {
      const amountRaw = parseUnits(args.amount_hbarx, HBARX_DECIMALS);

      const transaction = new AccountAllowanceApproveTransaction().approveTokenAllowance(
        TokenId.fromString(config.hbarxTokenId),
        AccountId.fromString(operatorAccountId),
        AccountId.fromString(config.stakingContractId),
        Number(amountRaw),
      );

      const payload: ApproveCorePayload = {
        transaction,
        extras: {
          amount_hbarx: args.amount_hbarx,
          spender: config.stakingContractId,
          hbarx_token_id: config.hbarxTokenId,
        },
      };
      return payload;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error building approve transaction",
      };
    }
  }

  override async shouldSecondaryAction(coreActionResult: unknown, _context: Context) {
    return isApproveCorePayload(coreActionResult);
  }

  async secondaryAction(payload: ApproveCorePayload, client: Client, context: Context) {
    const result = await handleTransaction(
      payload.transaction,
      client,
      context,
      approvePostProcess,
    );
    return { ...result, ...payload.extras };
  }
}

export const approveHbarxTool = new ApproveHbarxTool();
