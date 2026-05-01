# Diam — Demo Video Script (4 menit)

> Storyboard untuk recording. Target tone: institutional, confident, fast-paced.
> Aim: 240 seconds, 5 scenes.

## Pre-recording checklist

- [ ] OBS Studio configured 1080p/30fps + microphone test
- [ ] Browser: Chrome incognito, MetaMask connected ke Arbitrum Sepolia
- [ ] Wallet 1 (Maker): funded with 0.05 ETH, has cUSDC + cETH minted from faucet, **OperatorAuth banner already clicked for both tokens**
- [ ] Wallet 2 (Taker): funded, has cUSDC + cETH minted, **OperatorAuth banner already clicked for both tokens**
- [ ] Diam frontend running: `pnpm dev` on localhost:3000 (or hit https://private-otc.vercel.app)
- [ ] Arbiscan tab open on PrivateOTC: https://sepolia.arbiscan.io/address/0xBD27DABa875aF238Fc7f2848B23904c99Ae5A563
- [ ] Arbiscan tab open on DiamReceipt: https://sepolia.arbiscan.io/address/0xE011E57ff89a9b1450551A7cE402b75c5Bd27B85
- [ ] Uniswap tab open with ETH/USDC swap pre-loaded for the "pain" comparison
- [ ] Telegram screenshot of OTC desk chat (use mockup if don't have real one)
- [ ] Script printed beside monitor

---

## Scene 1 — The Pain (0:00 → 0:30, 30s)

**Visual:**
- 0:00 — Open Uniswap. Type "1000 ETH" in swap.
- 0:08 — Highlight slippage warning: "Price impact: 8.4%". Zoom in.
- 0:14 — Switch to Etherscan, highlight a real MEV sandwich attack tx (or mock). "Bots see your tx pending → front-run → you eat 2% extra cost"
- 0:22 — Cut to text overlay: "Whales lose ~$2-5M/day to MEV on public DEXs"

**Voice-over (30s):**
> "When a whale wants to sell 1,000 ETH on Uniswap, they hit two walls. First, slippage — 8% gone before they even click swap. Second, MEV bots watching the mempool — sandwich attacks, copy-trades, front-running. Every public DEX trade above $100K leaks alpha and burns capital. This is why institutions don't show up to DeFi."

---

## Scene 2 — Status Quo (0:30 → 1:15, 45s)

**Visual:**
- 0:30 — Cut to Telegram chat screenshot: "Hi GSR, looking to sell 1000 ETH for USDC. Price?"
- 0:38 — Pan across messages: "We can do $3,485, settled T+1, 0.05% fee" — "Wire details please" — "Done, here's the tx: 0x..."
- 0:48 — Text overlay: "Manual. No audit trail. Trust-based. Not composable."
- 0:58 — Quick stats: "$30B+/month flows through OTC desks. All over Telegram."
- 1:08 — Hard cut: black screen, white text "What if this could be on-chain — but private?"

**Voice-over (45s):**
> "So instead, they go OTC. Hedge funds, treasuries, market makers — they DM Telegram desks like GSR or Cumberland. Negotiate price. Wire fiat. Settle off-chain. It works, but it's manual. There's no audit trail. You have to trust the desk. And nothing about this is composable with the rest of DeFi. Thirty billion dollars a month, flowing through Telegram. In 2026."

---

## Scene 3 — The Demo (1:15 → 2:45, 90s)

**Visual:**
- 1:15 — Cut to Diam landing page (matrix-green theme, terminal aesthetic). Highlight tagline: "Your trade. Their guess. Nobody knows."
- 1:20 — `/intents` orderbook: paginated list with status filters (Open / Filled / Cancelled / Pending). Click filter `status=open` — URL updates to `?status=open` (shareable). Mention "10 rows per page, prev/next, all on-chain."
- 1:28 — Wallet 1 (Maker): click Faucet. Two amber `<OperatorAuth>` banners visible — one per token. Click each: "60-day approval, one tx each". Mint 100 cETH. Note encrypted on-chain via Nox.
- 1:38 — Click "Create Intent" → "RFQ Mode". The create form's submit button is disabled with tooltip "Authorize cETH first" until the operator banner above is clicked — then enables. Form: sell 50 cETH for cUSDC, deadline 1 hour. Submit.
- 1:48 — Encrypting animation, MetaMask sign, tx confirm. "Encrypted in TEE, settled on Arbitrum."
- 1:55 — Cut to Arbiscan tx: "IntentCreated" event visible. Amount field is `bytes32` handle, not plaintext.
- 2:02 — Switch to Wallet 2 (Taker 1). Browse intents (paginated) → click into the new RFQ. Submit sealed bid: 175,000 cUSDC. Encrypted, signed.
- 2:14 — Repeat for Wallet 3 (Taker 2): bid 180,000. Wallet 4 (Taker 3): bid 178,000.
- 2:24 — Wait for deadline (or warp via Foundry). Click "COMPUTE SECOND-PRICE" (`finalizeRFQ`). Status flips to **PendingReveal**.
- 2:30 — Maker reopens `/rfq/[id]`, clicks "Decrypt N bids via Nox", sees plaintext amounts. Per-bidder operator status is shown (red badge if a bidder hadn't authorized — picking them would revert). Click "Pick as winner" on highest. `revealRFQWinner` settles.
- 2:38 — Cut to `/portfolio`: maker decrypts received cUSDC → shows the actual amount. Other accounts can't decrypt — "Access denied".

**Voice-over (90s):**
> "Now watch this. Diam, built on iExec Nox, deployed on Arbitrum Sepolia. The orderbook is paginated, filterable by status, and shareable via URL. I'm the maker. The faucet shows me an authorize banner per token — one click each, sixty-day approval — so settlement never reverts mid-trade.
>
> I open an RFQ to sell fifty cETH for cUSDC. One hour bidding window. The create form locks until I've authorized — no dead-on-arrival intents. Submit. Encrypted via Nox in a Trusted Execution Environment, posted on-chain. On Arbiscan you see the IntentCreated event — but the amount is a 32-byte handle, not a number.
>
> Three takers see the asset pair, not the size. They submit sealed bids — encrypted at home, on-chain only as ciphertext.
>
> Deadline hits. Anyone calls finalize: Vickrey logic computes the encrypted second-price on-chain. Status becomes PendingReveal. The maker decrypts each bid client-side, picks the highest by index, and reveals the winner. Settlement transfers fifty confidential ETH from maker to winner, and the encrypted second-highest price the other way. Public Arbiscan? Sees a Settled event with bytes32 amounts. Nothing else."

---

## Scene 4 — Onchain Receipts + Beyond (2:45 → 3:30, 45s)

**Visual:**
- 2:45 — Back on the settled RFQ page. Scroll to the "On-chain NFT
  Receipt" card. Click **MINT RECEIPT**.
- 2:50 — ChainGPT image renders inline (gradient art with intent
  metadata overlays — pair, mode, fingerprint, NOX_TEE badge). Then
  MetaMask popup appears.
- 2:55 — Confirm — `DiamReceipt.mint(intentId, mode, txHash, pair)`.
  Receipt panel switches to "MINTED #N → Arbiscan". Call out: "Fully
  onchain SVG, no IPFS, this NFT survives any image host going dark."
- 3:02 — Cut to Claude Code terminal: `/otc-create cETH cUSDC 100`.
  MCP server invocation. Claude responds with intent ID + tx hash.
- 3:12 — Terminal showing MarketMaker agent log: `[market-maker] new
  RFQ #42 on cETH/cUSDC, evaluating bid… [market-maker] bid submitted
  on RFQ #42: tx=0x... pair=cETH/cUSDC (encrypted amount, refPrice=$3500)`
- 3:20 — Quick montage of: ChainGPT advisor showing fair-price check,
  RFQ Sweeper finalizing expired auction, MCP server browseIntents.
- 3:25 — Architecture diagram: 4 layers — MCP, Compound Engineering,
  Core Protocol, Receipt Layer.

**Voice-over (45s):**
> "Settlement isn't the end. One click mints an ERC-721 receipt straight
> to your wallet — image and metadata fully onchain via Base64-encoded
> SVG, no IPFS, no off-chain host that can disappear. The mint is
> idempotent: the button hides on revisit because the contract event log
> already proves you own a receipt for this trade.
>
> And trades themselves are just primitives. Diam ships four layers: the
> Core Protocol, an onchain Receipt layer, a Compound Engineering layer
> with autonomous agents that bid and sweep on your behalf, and an MCP
> server so Claude or Cursor can trade through Diam with one prompt.
> Vibe coding all the way down."

---

## Scene 5 — Close (3:30 → 4:00, 30s)

**Visual:**
- 3:30 — Cut to text card: "Same outcome as GSR's Zama trade — but permissionless, on-chain, programmable, AI-native."
- 3:40 — Logos: iExec Nox, ChainGPT, Arbitrum, Claude (small).
- 3:48 — GitHub URL displayed: github.com/PugarHuda/diam. Demo URL: private-otc.vercel.app.
- 3:55 — Final card: "Diam. Your trade. Their guess. Nobody knows."

**Voice-over (30s):**
> "Diam. Built in five days using vibe coding tools — Claude Code, ChainGPT, iExec Nox SDK. Hidden amounts. Vickrey-fair pricing. Compound Engineering agents. AI-native via MCP. Same institutional outcome as the GSR-Zama trade — but permissionless, on-chain, programmable. iExec Vibe Coding Challenge. Submission by Pugar Huda. Thank you."

---

## Recording tips

- Speak fast (180–200 wpm) but enunciate. Aim 4 minutes flat including pauses.
- Cut hard between scenes — no fade-outs, no music swells. This is institutional, not crypto-bro.
- Use Etherscan tabs as visual proof. Judges will appreciate verifiable on-chain action.
- Show the Strategy B "trade marked Filled even if bid below min" detail if possible — it's a unique privacy property.
- Avoid showing CHAINGPT_API_KEY or PRIVATE_KEY environment values.

---

## Bonus: Engineering credibility cut (60s, for X post / longer technical demo)

> Use this when you want to show *how* it was built, not just *what* it does.
> Strongest signal for technical judges.

**Visual:**
- 0:00 — Cut to terminal: `forge test --match-contract VickreyAlgorithm`. Watch tests run. Highlight `testFuzz_pickTopTwo_uniqueBidsYieldStrictSecondMax` running 256 iterations.
- 0:12 — Pull up `git log` showing the Vickrey bug fix commit. Highlight the diff: 3 lines changed in `_pickVickreyWinner`.
- 0:22 — Show `CHANGELOG.md` excerpt: *"Found and fixed a real Vickrey-correctness bug. Bid `[100, 300, 200]` would have charged `100` instead of correct `200`."*
- 0:35 — Cut to GitHub Actions tab: green CI badge, all 4 jobs passing — Solidity, web, MCP, agents.
- 0:48 — Final: terminal `pnpm test` total — "370 tests passing across 4 packages."

**Voice-over (60s):**
> "One more thing. While building Diam I wrote a test suite that mirrored the
> Vickrey algorithm in plain Solidity, then fuzzed it with 256 random bid sets.
> The mirror failed — meaning the on-chain encrypted version had the same bug.
> The contract was losing the second-highest bid when it fell between the
> initial highest and second. Three lines fixed it. Three hundred and seventy
> tests across four packages now stand behind every claim. *This* is what
> continuous testing buys you in confidential DeFi: not just code that works,
> but code you can prove works."

---

## After recording

- [ ] Export 1080p mp4, < 50MB
- [ ] Upload to YouTube/Vimeo (unlisted)
- [ ] Test playback on mobile (judges might watch on phone)
- [ ] Add to README.md + DoraHacks submission
- [ ] Generate 30-second highlight clip for X post
