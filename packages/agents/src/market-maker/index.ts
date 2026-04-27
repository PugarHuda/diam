/**
 * MarketMaker Agent — autonomous bidder.
 *
 * Listens for RFQ events. For each new RFQ matching configured pair,
 * encrypts a strategic bid via Nox SDK and submits on-chain.
 *
 * Strategy parameters (max notional, spread) are stored encrypted on-chain
 * via Nox.allow to agent address only — competitors can't front-run.
 */

import { z } from "zod";

const StrategySchema = z.object({
  pairs: z.array(z.string()),
  maxNotional: z.number(),
  spreadBps: z.number(),
  refPriceSource: z.enum(["chainlink", "chaingpt-oracle"]),
});

type Strategy = z.infer<typeof StrategySchema>;

const DEFAULT_STRATEGY: Strategy = {
  pairs: ["cETH/cUSDC"],
  maxNotional: 50_000,
  spreadBps: 30,
  refPriceSource: "chaingpt-oracle",
};

export async function startMarketMaker() {
  const strategy = DEFAULT_STRATEGY;
  console.log("[market-maker] started", strategy);

  // TODO: viem watchContractEvent on PrivateOTC.IntentCreated
  // TODO: For each new RFQ:
  //   1. Filter by configured pair
  //   2. Call ChainGPT for fair price
  //   3. Compute bid = fairPrice * (1 - spreadBps/10000)
  //   4. Encrypt via Nox SDK
  //   5. Call PrivateOTC.submitBid(rfqId, encryptedBid, proof)
}
