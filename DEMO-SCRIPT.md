# PrivateOTC — Demo Video Script (4 menit)

> Storyboard untuk recording. Target tone: institutional, confident, fast-paced.
> Aim: 240 seconds, 5 scenes.

## Pre-recording checklist

- [ ] OBS Studio configured 1080p/30fps + microphone test
- [ ] Browser: Chrome incognito, MetaMask connected ke Arbitrum Sepolia
- [ ] Wallet 1 (Maker): funded with 0.05 ETH, has cUSDC + cETH minted from faucet
- [ ] Wallet 2 (Taker): funded, has cUSDC minted
- [ ] PrivateOTC frontend running: `pnpm dev` on localhost:3000
- [ ] Etherscan tab open: https://sepolia.arbiscan.io/address/0x32C6552b0FB40833568ECb44aF70A44059FE3FF5
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
- 1:15 — Cut to PrivateOTC landing page on localhost:3000. Highlight tagline: "Your trade. Their guess. Nobody knows."
- 1:22 — Wallet 1 (Maker): connect wallet, click Faucet. Mint 100 cETH. Highlight that amount is encrypted on-chain via Nox.
- 1:32 — Click "Create Intent" → "RFQ Mode". Form: sell 50 cETH for cUSDC, deadline 1 hour.
- 1:42 — Click submit. Show encrypting animation, then MetaMask sign, then tx confirm. "Encrypted in TEE, settled on Arbitrum, gas paid in ETH."
- 1:55 — Cut to Etherscan tx: "IntentCreated" event visible. Highlight: amount field is bytes32 handle, not plaintext.
- 2:05 — Switch to Wallet 2 (Taker 1). Browse intents → see new RFQ with asset pair only. Submit sealed bid: 175,000 cUSDC. Encrypted, signed.
- 2:18 — Repeat for Wallet 3 (Taker 2): bid 180,000. Wallet 4 (Taker 3): bid 178,000.
- 2:28 — Wait for deadline (or warp via Foundry). Click "Finalize RFQ". Show Vickrey logic running on-chain. Cut to dramatic reveal: "Winner: Taker 2, pays $178,000 (second-highest bid, not the $180K they bid)."
- 2:38 — Cut to /portfolio. Maker decrypts received cUSDC → shows actual amount they got. Other accounts can't decrypt — shows "Access denied".

**Voice-over (90s):**
> "Now watch this. PrivateOTC, built on iExec Nox, deployed on Arbitrum Sepolia. I'm the maker. I mint a hundred confidential ETH from the faucet — already encrypted, no one sees the amount.
>
> I open an RFQ to sell fifty cETH for cUSDC. One hour bidding window. Submit. Encrypted via Nox in a Trusted Execution Environment, posted on-chain. On Etherscan you see the IntentCreated event — but the amount is a 32-byte handle, not a number.
>
> Three takers see the asset pair, not the size. They submit sealed bids — encrypted at home, on-chain only as ciphertext.
>
> Deadline hits. Anyone calls finalize. Vickrey logic runs entirely on encrypted values: highest wins, pays second-highest. The winner is revealed by address — but the price they pay stays encrypted on-chain. Maker decrypts and sees what they received. Public Etherscan? Sees a settle event with bytes32 amounts. Nothing else."

---

## Scene 4 — Beyond the Trade (2:45 → 3:30, 45s)

**Visual:**
- 2:45 — Cut to Claude Code terminal. Type: `/otc-create cETH cUSDC 100`. Show MCP server invocation.
- 2:55 — Claude responds with intent ID + tx hash. "AI agent just created an OTC intent on my behalf, encrypted, on-chain."
- 3:05 — Cut to terminal showing MarketMaker agent log: `[market-maker] new RFQ #42 on cETH/cUSDC, evaluating bid… [market-maker] bid submitted on RFQ #42: tx=0x... pair=cETH/cUSDC (encrypted amount, refPrice=$3500)`
- 3:15 — Quick montage of: ChainGPT advisor showing fair-price check, RFQ Sweeper finalizing expired auction, MCP server browseIntents response.
- 3:23 — Architecture diagram: 3 layers stacked — MCP Plugin (top), Compound Engineering Agents (middle), Core Protocol (bottom).

**Voice-over (45s):**
> "But trades are just primitives. The real value is what runs on top. PrivateOTC ships three layers. The Core Protocol — Solidity contracts and a Next.js frontend. A Compound Engineering layer — autonomous agents that bid for you, sweep expired RFQs, and analyze your trades nightly via ChainGPT. And an MCP server — so AI agents like Claude or Cursor can trade through PrivateOTC with one prompt. Vibe coding all the way down."

---

## Scene 5 — Close (3:30 → 4:00, 30s)

**Visual:**
- 3:30 — Cut to text card: "Same outcome as GSR's Zama trade — but permissionless, on-chain, programmable, AI-native."
- 3:40 — Logos: iExec Nox, ChainGPT, Arbitrum, Claude (small).
- 3:48 — GitHub URL displayed: github.com/[your-repo]/private-otc. Demo URL: privateotc.vercel.app (placeholder).
- 3:55 — Final card: "PrivateOTC. Your trade. Their guess. Nobody knows."

**Voice-over (30s):**
> "PrivateOTC. Built in five days using vibe coding tools — Claude Code, ChainGPT, iExec Nox SDK. Hidden amounts. Vickrey-fair pricing. Compound Engineering agents. AI-native via MCP. Same institutional outcome as the GSR-Zama trade — but permissionless, on-chain, programmable. iExec Vibe Coding Challenge. Submission by Pugar Huda. Thank you."

---

## Recording tips

- Speak fast (180–200 wpm) but enunciate. Aim 4 minutes flat including pauses.
- Cut hard between scenes — no fade-outs, no music swells. This is institutional, not crypto-bro.
- Use Etherscan tabs as visual proof. Judges will appreciate verifiable on-chain action.
- Show the Strategy B "trade marked Filled even if bid below min" detail if possible — it's a unique privacy property.
- Avoid showing CHAINGPT_API_KEY or PRIVATE_KEY environment values.

## After recording

- [ ] Export 1080p mp4, < 50MB
- [ ] Upload to YouTube/Vimeo (unlisted)
- [ ] Test playback on mobile (judges might watch on phone)
- [ ] Add to README.md + DoraHacks submission
- [ ] Generate 30-second highlight clip for X post
