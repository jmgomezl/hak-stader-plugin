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
import { uint256Arg } from "../utils/units";

const claimSchema = z.object({
  withdrawal_index: z
    .number()
    .int()
    .min(0)
    .describe(
      "0-based index of the withdrawal to claim. " +
        "Get this from stader_get_pending_withdrawals. " +
        "Only claimable after the unbonding period has passed.",
    ),
});

type ClaimInput = z.infer<typeof claimSchema>;

type ClaimCorePayload = {
  transaction: Transaction;
  extras: { withdrawal_index: number; undelegation_contract_id: string };
};

const isClaimCorePayload = (value: unknown): value is ClaimCorePayload =>
  typeof value === "object" && value !== null && "transaction" in value;

const claimPostProcess = (response: RawTransactionResponse) =>
  `Stader withdrawal claimed. HBAR should now be in your account. Status: ${response.status}. Transaction ID: ${response.transactionId}`;

export class ClaimWithdrawalTool extends BaseTool<ClaimInput, ClaimInput> {
  method = "stader_claim_withdrawal";
  name = "Stader Claim HBAR Withdrawal";
  description =
    "Claim HBAR from a completed Stader unstake request. " +
    "Can only be called after the 1-day unbonding period has passed. " +
    "Use stader_get_pending_withdrawals to find the withdrawal index and check if it is claimable.";
  parameters = claimSchema;

  async normalizeParams(
    params: ClaimInput,
    _context: Context,
    _client: Client,
  ): Promise<ClaimInput> {
    return claimSchema.parse(params);
  }

  async coreAction(args: ClaimInput, context: Context, _client: Client) {
    const config = resolveStaderConfig(context);

    if (!config.undelegationContractId) {
      return {
        success: false,
        error:
          "Missing undelegation contract ID. Set STADER_UNDELEGATION_CONTRACT_ID or pass network in config.",
      };
    }

    try {
      const params = new ContractFunctionParameters().addUint256(uint256Arg(args.withdrawal_index));

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(config.undelegationContractId))
        .setGas(config.gasLimit)
        .setFunction("withdraw", params);

      const payload: ClaimCorePayload = {
        transaction,
        extras: {
          withdrawal_index: args.withdrawal_index,
          undelegation_contract_id: config.undelegationContractId,
        },
      };
      return payload;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error building claim transaction",
      };
    }
  }

  override async shouldSecondaryAction(coreActionResult: unknown, _context: Context) {
    return isClaimCorePayload(coreActionResult);
  }

  async secondaryAction(payload: ClaimCorePayload, client: Client, context: Context) {
    const result = await handleTransaction(payload.transaction, client, context, claimPostProcess);
    return { ...result, ...payload.extras };
  }
}

export const claimWithdrawalTool = new ClaimWithdrawalTool();
