import {
  BaseTool,
  type Context,
  type RawTransactionResponse,
  handleTransaction,
} from "@hashgraph/hedera-agent-kit";
import {
  type Client,
  ContractExecuteTransaction,
  ContractId,
  Hbar,
  type Transaction,
} from "@hiero-ledger/sdk";
import { z } from "zod";
import { resolveStaderConfig } from "../config";

const stakeSchema = z.object({
  amount_hbar: z.string().describe("Amount of HBAR to stake (decimal format, e.g. '100' or '1.5')"),
});

type StakeInput = z.infer<typeof stakeSchema>;

type StakeCorePayload = {
  transaction: Transaction;
  extras: { amount_hbar: string; staking_contract_id: string };
};

const isStakeCorePayload = (value: unknown): value is StakeCorePayload =>
  typeof value === "object" && value !== null && "transaction" in value;

const stakePostProcess = (response: RawTransactionResponse) =>
  `Stader stake submitted. Status: ${response.status}. Transaction ID: ${response.transactionId}`;

export class StakeHbarTool extends BaseTool<StakeInput, StakeInput> {
  method = "stader_stake_hbar";
  name = "Stader Stake HBAR";
  description =
    "Stake HBAR with Stader on Hedera to receive HBARX (liquid staking token). " +
    "HBARX earns staking rewards while remaining transferable and usable in DeFi. " +
    "Must run stader_approve_hbarx before unstaking later.";
  parameters = stakeSchema;

  async normalizeParams(
    params: StakeInput,
    _context: Context,
    _client: Client,
  ): Promise<StakeInput> {
    return stakeSchema.parse(params);
  }

  async coreAction(args: StakeInput, context: Context, _client: Client) {
    const config = resolveStaderConfig(context);

    if (!config.stakingContractId) {
      return {
        success: false,
        error:
          "Missing staking contract ID. Set STADER_STAKING_CONTRACT_ID or pass network in config.",
      };
    }

    const amount = Number(args.amount_hbar);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: `Invalid amount_hbar: ${args.amount_hbar}` };
    }

    try {
      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(config.stakingContractId))
        .setGas(config.gasLimit)
        .setFunction("stake")
        .setPayableAmount(new Hbar(amount));

      const payload: StakeCorePayload = {
        transaction,
        extras: {
          amount_hbar: args.amount_hbar,
          staking_contract_id: config.stakingContractId,
        },
      };
      return payload;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error building stake transaction",
      };
    }
  }

  override async shouldSecondaryAction(coreActionResult: unknown, _context: Context) {
    return isStakeCorePayload(coreActionResult);
  }

  async secondaryAction(payload: StakeCorePayload, client: Client, context: Context) {
    const result = await handleTransaction(payload.transaction, client, context, stakePostProcess);
    return { ...result, ...payload.extras };
  }
}

export const stakeHbarTool = new StakeHbarTool();
