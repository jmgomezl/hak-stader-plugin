import type { Plugin } from "@hashgraph/hedera-agent-kit";
import { approveHbarxTool } from "./tools/approve-hbarx";
import { claimWithdrawalTool } from "./tools/claim-withdrawal";
import { getExchangeRateTool } from "./tools/get-exchange-rate";
import { getHbarxBalanceTool } from "./tools/get-hbarx-balance";
import { getPendingWithdrawalsTool } from "./tools/get-pending-withdrawals";
import { getStakingInfoTool } from "./tools/get-staking-info";
import { stakeHbarTool } from "./tools/stake-hbar";
import { unstakeHbarxTool } from "./tools/unstake-hbarx";

export const staderPlugin: Plugin = {
  name: "stader",
  description:
    "Integration with Stader liquid staking on Hedera. Stake HBAR to receive HBARX " +
    "(a yield-bearing liquid staking token usable in DeFi while earning staking rewards).",
  tools: () => [
    stakeHbarTool,
    approveHbarxTool,
    unstakeHbarxTool,
    claimWithdrawalTool,
    getPendingWithdrawalsTool,
    getHbarxBalanceTool,
    getExchangeRateTool,
    getStakingInfoTool,
  ],
};
