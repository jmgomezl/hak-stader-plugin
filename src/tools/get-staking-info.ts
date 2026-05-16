import { BaseTool, type Context } from "@hashgraph/hedera-agent-kit";
import { type Client } from "@hiero-ledger/sdk";
import { z } from "zod";
import { type StaderContractClient, createStaderContractClient } from "../client";
import { resolveStaderConfig } from "../config";

const stakingInfoSchema = z.object({});

type StakingInfoInput = z.infer<typeof stakingInfoSchema>;

export class GetStakingInfoTool extends BaseTool<StakingInfoInput, StakingInfoInput> {
  method = "stader_get_staking_info";
  name = "Stader Get Staking Info";
  description =
    "Get current Stader protocol status on Hedera: whether staking/unstaking is paused, " +
    "the unbonding period duration, and the contract addresses in use. " +
    "Call this before staking to confirm the protocol is operational.";
  parameters = stakingInfoSchema;

  async normalizeParams(
    params: StakingInfoInput,
    _context: Context,
    _client: Client,
  ): Promise<StakingInfoInput> {
    return stakingInfoSchema.parse(params);
  }

  async coreAction(_args: StakingInfoInput, context: Context, client: Client) {
    const config = resolveStaderConfig(context);

    if (!config.stakingContractId || !config.undelegationContractId) {
      return {
        success: false,
        error:
          "Missing contract IDs. Set STADER_NETWORK or individual contract ID env vars.",
      };
    }

    try {
      const contractClient: StaderContractClient =
        (context as { staderContractClient?: StaderContractClient }).staderContractClient ??
        createStaderContractClient(config, client);

      const [isStakePaused, isUnstakePaused, unbondingTime] = await Promise.all([
        contractClient.isStakePaused(),
        contractClient.isUnstakePaused(),
        contractClient.unbondingTime(),
      ]);

      return {
        success: true,
        stake_paused: isStakePaused,
        unstake_paused: isUnstakePaused,
        staking_open: !isStakePaused,
        unstaking_open: !isUnstakePaused,
        unbonding_time_seconds: unbondingTime,
        unbonding_time_hours: Number((unbondingTime / 3600).toFixed(2)),
        staking_contract_id: config.stakingContractId,
        undelegation_contract_id: config.undelegationContractId,
        hbarx_token_id: config.hbarxTokenId ?? null,
        network: config.network ?? "unknown",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error fetching staking info",
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

export const getStakingInfoTool = new GetStakingInfoTool();
