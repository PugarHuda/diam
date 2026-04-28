/**
 * Seed bids — places sealed bids on open RFQs from various wallets.
 * After this runs, RFQ pages show populated bid lists ready for finalize.
 *
 * Run: PRIVATE_KEY=0x... pnpm --filter agents seed-bids
 */

import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  parseAbi,
  keccak256,
  stringToBytes,
  formatEther,
  type WalletClient,
  type PublicClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import { createViemHandleClient } from "@iexec-nox/handle";

const ADDRESSES = {
  privateOtc: "0x5b2C0c83e41bF9ef072d742096C49DFDB814CEB4" as `0x${string}`,
  cusdc: "0x57736B816F6cb53c6B2c742D3A162E89Db162ADE" as `0x${string}`,
};

const otcAbi = parseAbi([
  "function submitBid(uint256 id, bytes32 bidAmountHandle, bytes bidProof)",
  "function intents(uint256) view returns (address maker, address sellToken, address buyToken, bytes32 sellAmount, bytes32 minBuyAmount, uint64 deadline, uint8 status, uint8 mode, address allowedTaker)",
]);

const seedKey = (label: string) =>
  keccak256(stringToBytes(`diam-demo-${label}`)) as `0x${string}`;

interface BidPlan {
  rfqId: bigint;
  bidder: string;
  bidderKey: `0x${string}`;
  amount: bigint; // raw cUSDC
}

async function main() {
  const adminKey = process.env.PRIVATE_KEY;
  if (!adminKey || !/^0x[a-fA-F0-9]{64}$/.test(adminKey)) {
    throw new Error("PRIVATE_KEY required");
  }

  const rpc =
    process.env.ARBITRUM_SEPOLIA_RPC_URL ??
    "https://sepolia-rollup.arbitrum.io/rpc";
  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(rpc),
  });

  // Bid plan — varied amounts so Vickrey winner is interesting
  // After fresh deploy, RFQ ids: deployer's = #2, Carol's = #5
  const bids: BidPlan[] = [
    // RFQ #2 (deployer's RFQ: 2 cETH for cUSDC, 6h window)
    { rfqId: 2n, bidder: "Alice", bidderKey: seedKey("alice"), amount: parseUnits("6000", 6) },
    { rfqId: 2n, bidder: "Bob", bidderKey: seedKey("bob"), amount: parseUnits("6500", 6) },
    { rfqId: 2n, bidder: "Carol", bidderKey: seedKey("carol"), amount: parseUnits("6300", 6) },

    // RFQ #5 (Carol's RFQ: 1 cETH for cUSDC, 4h window) — only need 1 more (Alice + Bob already bid in earlier run)
    { rfqId: 5n, bidder: "Deployer", bidderKey: adminKey as `0x${string}`, amount: parseUnits("3200", 6) },
  ];

  for (const plan of bids) {
    const acc = privateKeyToAccount(plan.bidderKey);
    const balance = await publicClient.getBalance({ address: acc.address });
    if (balance < parseUnits("0.001", 18)) {
      console.warn(
        `[seed-bids] ${plan.bidder} (${acc.address}) low ETH (${formatEther(balance)}), skipping`,
      );
      continue;
    }

    // Verify RFQ is open + not maker
    let intent;
    try {
      intent = (await publicClient.readContract({
        address: ADDRESSES.privateOtc,
        abi: otcAbi,
        functionName: "intents",
        args: [plan.rfqId],
      })) as readonly [
        `0x${string}`,
        `0x${string}`,
        `0x${string}`,
        `0x${string}`,
        `0x${string}`,
        bigint,
        number,
        number,
        `0x${string}`,
      ];
    } catch (err) {
      console.warn(`[seed-bids] RFQ #${plan.rfqId} read failed`, err);
      continue;
    }

    const status = intent[6];
    const mode = intent[7];
    const maker = intent[0];
    const deadline = intent[5];

    if (status !== 0) {
      console.log(`[seed-bids] RFQ #${plan.rfqId} not open (status=${status}), skipping`);
      continue;
    }
    if (mode !== 1) {
      console.log(`[seed-bids] #${plan.rfqId} not RFQ (mode=${mode}), skipping`);
      continue;
    }
    if (deadline < BigInt(Math.floor(Date.now() / 1000))) {
      console.log(`[seed-bids] RFQ #${plan.rfqId} expired, skipping`);
      continue;
    }
    if (maker.toLowerCase() === acc.address.toLowerCase()) {
      console.log(`[seed-bids] ${plan.bidder} is maker of RFQ #${plan.rfqId}, skipping (cannot self-bid)`);
      continue;
    }

    console.log(
      `\n[seed-bids] ─── ${plan.bidder} bids on RFQ #${plan.rfqId} ───`,
    );
    console.log(`  ${acc.address} → bid ${plan.amount} (raw cUSDC)`);

    const wallet = createWalletClient({
      account: acc,
      chain: arbitrumSepolia,
      transport: http(rpc),
    });
    const handleClient = await createViemHandleClient(wallet);

    const enc = await handleClient.encryptInput(
      plan.amount,
      "uint256",
      ADDRESSES.privateOtc,
    );

    try {
      const tx = await wallet.writeContract({
        address: ADDRESSES.privateOtc,
        abi: otcAbi,
        functionName: "submitBid",
        args: [
          plan.rfqId,
          enc.handle as `0x${string}`,
          enc.handleProof as `0x${string}`,
        ],
        chain: wallet.chain,
        account: wallet.account!,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      console.log(`  ✓ tx ${tx}`);
    } catch (err) {
      console.error(`  ✗ submitBid failed:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(
    "\n[seed-bids] ✓ done. View RFQs:",
  );
  console.log("  https://private-otc.vercel.app/rfq/5");
  console.log("  https://private-otc.vercel.app/rfq/8");
}

main().catch((err) => {
  console.error("[seed-bids] failed:", err);
  process.exit(1);
});
