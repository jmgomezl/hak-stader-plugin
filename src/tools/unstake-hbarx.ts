import {
  BaseTool,
  type Context,
  type RawTransactionResponse,
  handleTransaction,
} from "@hashgraph/hedera-agent-kit";
import {
  type Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
  type Transaction,
} from "@hiero-ledger/sdk";
import { z } from "zod";
import { resolveStaderConfig } from "../config";
import { parseUnits, uint256Arg } from "../utils/units";

const HBARX_DECIMALS = 8;

const unstakeSchema = z.object({
  amount_hbarx: z
    .string()
    .describe(
      "Amount of HBARX to unstake (decimal format, e.g. '100' or '1.5'). " +
        "Requires a prior stader_approve_hbarx call for at least this amount. " +
        "After unstaking, claim HBAR with stader_claim_withdrawal after the unbonding period (~1 day).",
    ),
});

type UnstakeInput = z.infer<typeof unstakeSchema>;

type UnstakeCorePayload = {
  transaction: Transaction;
  extras: { amount_hbarx: string; amount_hbarx_raw: string; staking_contract_id: string };
};

const isUnstakeCorePayload = (value: unknown): value is UnstakeCorePayload =>
  typeof value === "object" && value !== null && "transaction" in value;

const unstakePostProcess = (response: RawTransactionResponse) =>
  `Stader unstake submitted. HBAR will be claimable after the unbonding period (~1 day). Status: ${response.status}. Transaction ID: ${response.transactionId}`;

export class UnstakeHbarxTool extends BaseTool<UnstakeInput, UnstakeInput> {
  method = "stader_unstake_hbar";
  name = "Stader Unstake HBARX";
  description =
    "Initiate unstaking of HBARX on Stader. Burns HBARX and begins the 1-day unbonding period. " +
    "Call stader_get_pending_withdrawals to check status, then stader_claim_withdrawal to receive HBAR. " +
    "Requires a prior stader_approve_hbarx call for at least the same amount.";
  parameters = unstakeSchema;

  async normalizeParams(
    params: UnstakeInput,
    _context: Context,
    _client: Client,
  ): Promise<UnstakeInput> {
    return unstakeSchema.parse(params);
  }

  async coreAction(args: UnstakeInput, context: Context, _client: Client) {
    const config = resolveStaderConfig(context);

    if (!config.stakingContractId) {
      return {
        success: false,
        error:
          "Missing staking contract ID. Set STADER_STAKING_CONTRACT_ID or pass network in config.",
      };
    }

    try {
      const amountRaw = parseUnits(args.amount_hbarx, HBARX_DECIMALS);

      const params = new ContractFunctionParameters().addUint256(uint256Arg(amountRaw));

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(config.stakingContractId))
        .setGas(config.gasLimit)
        .setFunction("unStake", params);

      const payload: UnstakeCorePayload = {
        transaction,
        extras: {
          amount_hbarx: args.amount_hbarx,
          amount_hbarx_raw: amountRaw,
          staking_contract_id: config.stakingContractId,
        },
      };
      return payload;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error building unstake transaction",
      };
    }
  }

  override async shouldSecondaryAction(coreActionResult: unknown, _context: Context) {
    return isUnstakeCorePayload(coreActionResult);
  }

  async secondaryAction(payload: UnstakeCorePayload, client: Client, context: Context) {
    const result = await handleTransaction(
      payload.transaction,
      client,
      context,
      unstakePostProcess,
    );
    return { ...result, ...payload.extras };
  }
}

export const unstakeHbarxTool = new UnstakeHbarxTool();
