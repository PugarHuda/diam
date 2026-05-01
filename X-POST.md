# X Post Draft — iExec Vibe Coding Challenge Submission

> Required: tag `@iEx_ec` and `@Chain_GPT`, include demo video, GitHub link, project description.

---

## Option A — Single tweet (concise, professional)

```
🔒 Diam — confidential OTC desk on @iEx_ec Nox protocol

Whales lose ~$5M/day to MEV on public DEXs. Diam settles
institutional trades on-chain with hidden amounts and Vickrey-fair
RFQ pricing. Built in 5 days with @Chain_GPT.

Demo: [video link]
Code: github.com/PugarHuda/diam
Live: private-otc.vercel.app

Submission for #iExecVibeCoding 🛠️
```

---

## Option B — Thread (more depth, more shareable)

### Tweet 1
```
🔒 Introducing Diam

An on-chain OTC desk where amounts stay encrypted end-to-end.
Built on @iEx_ec Nox protocol + @Chain_GPT for the Vibe Coding Challenge.

Today, $30B/month in OTC trades happens via Telegram. We can do better. 🧵

[demo video, 30s clip]
```

### Tweet 2
```
The problem:

— Whales selling 1,000 ETH on Uniswap = 8% slippage + MEV sandwich
— OTC desks (GSR, Cumberland) solve slippage but live on Telegram
— No audit trail. No composability. No DeFi composability.

Institutions stay out. $30T waits.
```

### Tweet 3
```
The solution: Diam

✅ Hidden amounts (Nox confidential computing on Arbitrum Sepolia)
✅ Vickrey-fair RFQ (highest bid wins, pays second-highest, encrypted)
✅ Atomic settlement via ERC-7984
✅ Onchain ERC-721 trade receipts (Base64 SVG, no IPFS)
✅ Composable with any ERC-20

Same outcome as GSR's first confidential OTC. On-chain, permissionless.
```

### Tweet 4
```
Three layers, vibe-coded:

1️⃣ Core Protocol — Solidity 0.8.27 + Foundry, Next.js 16 frontend
2️⃣ Compound Engineering — autonomous agents (MarketMaker, RFQ Sweeper, ChainGPT-powered Strategy Coach)
3️⃣ MCP Server — Claude/Cursor/ChainGPT can trade via 1 prompt

🤖 AI-native, end-to-end.
```

### Tweet 5
```
Built solo using Claude Code, @Chain_GPT, and the iExec Nox SDK.

Strategy B (atomic safeSub + select) means failed bids settle as no-ops, on-chain — privacy-preserving even on rejection.

Each settled trade mints an ERC-721 receipt straight to your wallet — image and metadata fully onchain via Base64 SVG. No IPFS, no link rot.

Full feedback for the @iEx_ec team in the repo.

Code → github.com/PugarHuda/diam
```

### Tweet 6 (optional bookend)
```
Why this matters: confidential DeFi unlocks the $30T of institutional capital that won't touch a public mempool.

@iEx_ec is building the rails. @Chain_GPT is building the AI layer. Together = the next chapter for institutional DeFi.

#iExecVibeCoding #ConfidentialDeFi
```

---

## Visual assets to attach

- 30-second video clip (best moment from demo: Vickrey reveal animation, then NFT receipt mint)
- Screenshot of /create/rfq form with `<OperatorAuth>` banner visible
- Screenshot of Arbiscan showing `IntentCreated` event with bytes32 amount handle
- Screenshot of a minted DiamReceipt NFT on Arbiscan (token detail page with onchain SVG rendered)
- Architecture diagram (4 layers stacked: MCP, Compound Engineering, Core Protocol, Receipt)

## Final checklist before posting

- [ ] Demo video uploaded (YouTube/Vimeo, public)
- [ ] GitHub repo public + README updated with deployment addresses
- [ ] Vercel deployment live + accessible
- [ ] Test all links from Option A (single) → click each in incognito
- [ ] `@iEx_ec` and `@Chain_GPT` properly tagged (verify handles exist)
- [ ] Add hashtag `#iExecVibeCoding` for discoverability
- [ ] Schedule post for peak engagement window (Tue–Thu, 14:00-17:00 UTC)
- [ ] Plan to respond to first 5 comments within 1 hour for algorithm boost

## Post-posting

- [ ] Submit URL of X post on DoraHacks submission page
- [ ] Cross-post to iExec Discord #vibe-coding-challenge channel
- [ ] Cross-post to TUM Blockchain Discord (community partner)
- [ ] DM `@vladnazarxyz` Telegram thanking for ChainGPT credits
