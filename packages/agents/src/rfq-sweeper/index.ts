/**
 * RFQ Sweeper Agent — finalize expired RFQs.
 *
 * Polls every 5 minutes. Scans last N intents for RFQs where:
 *   - mode = RFQ
 *   - status = Open (0)
 *   - block.timestamp > deadline
 *   - bids.length >= 2 (else finalize would revert)
 * Calls finalizeRFQ to settle.
 */

import { publicClient, walletClient, PRIVATE_OTC_ADDRESS } from "../config.js";
import { privateOtcAbi } from "../abi.js";

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
const SCAN_DEPTH = 50; // last 50 intents

const RFQ_BIDS_ABI = [
  {
    type: "function",
    name: "bids",
    stateMutability: "view",
    inputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
    outputs: [
      { name: "taker", type: "address" },
      { name: "offeredAmount", type: "bytes32" },
      { name: "active", type: "bool" },
    ],
  },
] as const;

export async function startRfqSweeper() {
  console.log("[rfq-sweeper] starting (interval 5m)");
  await sweep();
  setInterval(() => sweep().catch((e) => console.error("[rfq-sweeper]", e)), SWEEP_INTERVAL_MS);
}

async function sweep() {
  const next = (await publicClient.readContract({
    address: PRIVATE_OTC_ADDRESS,
    abi: privateOtcAbi,
    functionName: "nextIntentId",
  })) as bigint;

  const start = next > BigInt(SCAN_DEPTH) ? next - BigInt(SCAN_DEPTH) : 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));

  for (let id = start; id < next; id++) {
    try {
      const intent = (await publicClient.readContract({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "intents",
        args: [id],
      })) as readonly [
        `0x${string}`, // maker
        `0x${string}`, // sellToken
        `0x${string}`, // buyToken
        `0x${string}`, // sellAmountHandle
        `0x${string}`, // minBuyAmountHandle
        bigint, // deadline
        number, // status
        number, // mode
        `0x${string}`, // allowedTaker
      ];

      const status = intent[6];
      const mode = intent[7];
      const deadline = intent[5];

      if (status !== 0 || mode !== 1 || deadline >= now) continue;

      const bidCount = await countBids(id);
      if (bidCount < 2) continue;

      console.log(`[rfq-sweeper] finalizing RFQ #${id} (${bidCount} bids)`);
      const txHash = await walletClient.writeContract({
        address: PRIVATE_OTC_ADDRESS,
        abi: privateOtcAbi,
        functionName: "finalizeRFQ",
        args: [id],
      });
      console.log(`[rfq-sweeper] tx=${txHash}`);
    } catch (err) {
      // Continue with next intent on per-id failure
      console.error(`[rfq-sweeper] id=${id} failed`, err instanceof Error ? err.message : err);
    }
  }
}

async function countBids(rfqId: bigint): Promise<number> {
  let count = 0;
  for (let i = 0; i < 10; i++) {
    try {
      const result = (await publicClient.readContract({
        address: PRIVATE_OTC_ADDRESS,
        abi: RFQ_BIDS_ABI,
        functionName: "bids",
        args: [rfqId, BigInt(i)],
      })) as readonly [`0x${string}`, `0x${string}`, boolean];
      if (result[2]) count++;
    } catch {
      break; // Out-of-bounds revert = no more bids
    }
  }
  return count;
}
