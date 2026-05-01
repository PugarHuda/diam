# How to Use Diam — Complete Walkthrough

> **Live demo:** https://private-otc.vercel.app
> **Network:** Arbitrum Sepolia (chain id `421614`)

This guide takes you from zero to a fully-executed confidential OTC trade in ~10 minutes.

---

## Prerequisites

You'll need:

1. **A browser wallet** — MetaMask, Rabby, or Coinbase Wallet
2. **Arbitrum Sepolia ETH** for gas (~$0 in real value, just gas)
   - Get from: https://www.alchemy.com/faucets/arbitrum-sepolia
3. **5 minutes**

You do **NOT** need:
- Real money
- KYC
- ChainGPT API key (server already has one for the demo)
- Any iExec setup — it's all on Arbitrum Sepolia

---

## Step 1 — Connect Wallet (30s)

1. Visit https://private-otc.vercel.app
2. Click **Connect Wallet** in the top-right
3. Choose your wallet, approve connection
4. Switch to **Arbitrum Sepolia** if prompted

You should see:
- Top-right network badge: green dot + `ARB-SEP`
- Sidebar: `NODE_XXXX · Verified Agent`

---

## Step 2 — Mint Test Tokens (1 min)

Diam ships with two mock ERC-7984 confidential tokens (`cUSDC`, `cETH`) plus a public faucet.

1. Click **Faucet** in the sidebar (or top nav)
2. Pick `cUSDC` → keep default `10000` → click **MINT 10000 cUSDC**
3. Approve in wallet, wait for confirm (~2s)
4. Click `cETH` → enter `10` → **MINT 10 cETH**
5. Approve

Both balances are now encrypted on-chain — even YOU can't see them on Etherscan.

---

## Step 3 — Verify Encrypted Balance (30s)

1. Go to **Portfolio**
2. You'll see two rows: cUSDC + cETH
3. Each shows a `lock` icon + truncated handle (e.g. `0xa3f9b7…`) — that's the on-chain reference, not the value
4. Click **DECRYPT** on cUSDC
5. Wallet prompts a signature → approve
6. Plaintext value appears: `10000.000000 cUSDC` ✓

What just happened:
- Browser called Nox JS SDK `decrypt(handle)`
- SDK signed an EIP-712 message with your wallet (proving you own the address)
- Handle Gateway returned encrypted blob + key share
- Browser decrypted **locally** — value never left your device

---

## Step 4 — Approve Diam as Operator (one-time)

Before Diam can move tokens between you and a counterparty, you authorize it as an **operator** on each cToken (similar to ERC-20 `approve`, but time-bound).

The faucet page now ships an `<OperatorAuth>` banner per token. After
minting (Step 2), you'll see two amber blocks — one for cUSDC, one for
cETH — each with a **Authorize Diam (cUSDC, 60d)** button. Click each
once. MetaMask prompts a single tx per token (calls
`cToken.setOperator(PrivateOTC, now + 60 days)`); the banner auto-flips
to green once the receipt lands and never bothers you again until the
60-day expiry. The same banner also appears on `/create/direct`,
`/create/rfq`, `/intents/[id]`, and `/rfq/[id]` — anywhere a missing
operator would otherwise turn into a "DiamCToken: not operator" revert.

> **Why both tokens?** Settlement pulls sell-side from the maker AND
> buy-side from the taker, so each party needs to be authorized on the
> token they're sending out. Authorizing both upfront covers maker +
> taker roles in any future trade.

Manual fallback (rarely needed):
```bash
cast send 0xb690aaDa4e23620D0dcDE4c493BC1D90F791aB3F \
  "setOperator(address,uint48)" \
  0xBD27DABa875aF238Fc7f2848B23904c99Ae5A563 \
  $((`date +%s` + 5184000))    # +60 days
```

---

## Step 5 — Create a Direct OTC Intent (1 min)

1. Click **Create** in the sidebar
2. Click **Direct OTC** card
3. Fill in:
   - **Sell Token:** cETH
   - **Sell Amount:** 1
   - **Buy Token:** cUSDC
   - **Min Buy Amount:** 3000  *(your hidden minimum — encrypted)*
   - **Expires In:** 1H
   - **Allowed Taker:** *(leave empty to open to anyone)*
4. **ChainGPT Advisor** appears: click **CHECK** → AI-fetched fair price compared to yours, ⚠ warning if off-market
5. Click **BROADCAST ENCRYPTION**
6. Wallet signs:
   - **Step 1:** "Encrypting amounts via Nox" (off-chain HTTP to Handle Gateway)
   - **Step 2:** "Confirm in wallet" (one EIP-1559 tx on Arbitrum)
   - **Step 3:** "Confirming on-chain" (~1 block)
7. Success: `INTENT #N BROADCAST.` with Etherscan link

What's now on-chain:
- Asset pair (cETH → cUSDC): visible
- Maker: visible (your address)
- Sell amount + min buy amount: **encrypted bytes32 handles**, not numbers

---

## Step 6 — Browse + Accept Intents (taker role, 1 min)

Open in a **second wallet** (or another browser profile) to play taker:

1. Go to **Active Intents** (sidebar)
2. The orderbook shows **10 rows per page** with prev/next + page indicator,
   filterable by mode (Direct / RFQ), status (Open / Pending / Filled /
   Cancelled), pair, and "Mine only". Filter state is shareable via URL
   params (`/intents?status=open&mode=rfq&p=2`).
3. Click **Accept** on a Direct intent
4. On the detail page:
   - Inspect the manifest (status, maker, encrypted handles, expires)
   - The page also surfaces operator readiness: a red banner appears if
     the maker hasn't authorized their sellToken (the trade would revert
     — UI blocks submit + tells you why).
   - Enter your bid (e.g. `3500` cUSDC)
   - Click **ACCEPT + SETTLE**. Button stays disabled until both sides'
     `setOperator` is in place.
5. Wallet signs:
   - Encrypts your bid via Nox
   - Calls `acceptIntent(id, handle, proof)` on PrivateOTC
   - **Strategy B fires:** `safeSub(buyAmount, minBuyAmount)` checks sufficiency, `select` routes real amounts (or zeros if insufficient) — atomic
   - cTokens transfer atomically: cETH → you, cUSDC → maker
6. Trade settled. Status: **Filled**. The button switches to "SETTLED ✓"
   and is locked — no accidental re-submits.

> **Privacy property:** if your bid was below maker's minimum, the trade is marked `Filled` BUT actual amounts transferred are encrypted zeros. Etherscan observers cannot distinguish a successful trade from a no-op rejection. That's Strategy B.

---

## Step 7 — RFQ Mode (Vickrey Auction, 2-step)

For multi-bidder execution:

1. **Create** → **RFQ Mode**
2. Fill: sell asset, buy asset, sell amount, bidding window (30M / 1H / 6H / 1D)
3. Notice the **MarketSignal** sidebar — ChainGPT bias indicator (Bullish/Bearish/Neutral) for the pair
4. Submit → RFQ opens, deadline counts down
5. Multiple takers go to `/rfq/[id]` and submit sealed bids (encrypted, max 10 bidders)
6. After deadline, anyone calls **COMPUTE SECOND-PRICE** (`finalizeRFQ`).
   Status flips to **PendingReveal**.
7. On-chain Vickrey logic computes the encrypted second price:
   ```solidity
   for (uint i = 1; i < bids.length; i++) {
     ebool isHigher = Nox.gt(candidate, highest);
     ebool isMiddle = Nox.gt(candidate, second);
     euint256 newSecondIfNotHigher = Nox.select(isMiddle, candidate, second);
     second  = Nox.select(isHigher, highest, newSecondIfNotHigher);
     highest = Nox.select(isHigher, candidate, highest);
   }
   priceToPay = second;  // encrypted
   ```
8. The maker opens `/rfq/[id]` (only they can see the **Reveal Winner**
   panel), clicks **Decrypt N bids via Nox**, sees plaintext bid amounts,
   and clicks **Pick as winner** on the highest one. Each bid row also
   shows whether that bidder has authorized buyToken — picking an
   unauthorized bidder is blocked because settlement would revert.
9. `revealRFQWinner(id, winnerIdx)` runs settlement: maker → winner
   transfers `sellAmount`, winner → maker transfers `priceToPay`
   (= second-highest, encrypted). Status becomes **Filled**.

---

## Step 8 — Mint Your Onchain NFT Receipt (15s)

Settled trades can be commemorated with an ERC-721 NFT keepsake minted
straight to your wallet. Both maker and taker (or RFQ winner) qualify.

1. On the settled intent / RFQ detail page, scroll to the **On-chain NFT
   Receipt** card.
2. Click **MINT RECEIPT**. Sequence:
   - ChainGPT generates a 512×512 image preview (~5–15s, the image renders
     **before** the wallet popup so you see what you're about to mint).
   - MetaMask prompts a single tx — `DiamReceipt.mint(intentId, mode,
     settleTxHash, pair)`.
   - Once confirmed, the panel shows **MINTED #N** with a link to the
     token on Arbiscan and your tx hash.
3. The button is idempotent — once minted, the panel surfaces "MINTED #N"
   on every revisit, no duplicate mint possible. Backed by an event-log
   read of `ReceiptMinted(uint256 indexed tokenId, uint256 indexed
   intentId, address indexed minter, uint8 mode)`.
4. Metadata is fully on-chain: `tokenURI` returns
   `data:application/json;base64,...` with an inline SVG (gradient bg,
   trade ID, pair, mode, settle tx). No IPFS, no off-chain image host —
   the keepsake survives forever as long as Arbitrum does.

> Random visitors viewing a settled trade see a **Read-only view** notice
> instead of the mint button — receipts gate to actual participants
> (maker via the intent struct, taker / winner via the `Settled` event log).

---

## Recap — What You Just Did

You executed a confidential OTC trade where:

✅ Asset pair is public, amounts are encrypted bytes32 handles
✅ Maker's hidden minimum is enforced atomically — privacy preserved on rejection
✅ MEV bots cannot extract value from your order
✅ Settlement is atomic via ERC-7984 `confidentialTransferFrom`
✅ AI advisor checked your price vs market via ChainGPT
✅ Settled trade was committed as an onchain ERC-721 NFT with fully
   onchain SVG metadata — no IPFS, no off-chain image host

All on Arbitrum Sepolia. All without trusted intermediaries. All without revealing a byte of size or price to public observers.

---

## Troubleshooting

**"Connect wallet" doesn't open my wallet** — Some wallets need explicit chain config. Manually switch to Arbitrum Sepolia first (chain id `421614`, RPC `https://sepolia-rollup.arbitrum.io/rpc`).

**Decrypt button shows "ACL membership required"** — You don't have permission for that handle. Mint via faucet first to be granted ACL automatically.

**Faucet tx reverts** — You're out of Arbitrum Sepolia ETH for gas. Refill from https://www.alchemy.com/faucets/arbitrum-sepolia.

**ChainGPT shows "API key not set"** — Demo deployment has key configured. If you self-host, set `CHAINGPT_API_KEY` env var (DM `@vladnazarxyz` Telegram for free hackathon credits).

**Encryption step hangs >30s** — Handle Gateway congestion or network issue. Refresh and retry.

---

## Architecture (for the curious)

```
You ─→ Nox JS SDK encrypts amount ─→ Handle Gateway returns (handle, proof)
                                              │
                                              ▼
       Wallet signs PrivateOTC.createIntent(handle, proof)
                                              │
                                              ▼
              Arbitrum Sepolia ── NoxCompute proxy validates proof
                                              │
                                              ▼
              On-chain Intent stored with bytes32 handles
                  │                                      │
                  ▼                                      ▼
        Taker calls acceptIntent              Maker calls cancelIntent
                  │
                  ▼
     Strategy B: safeSub + select → atomic settlement
                  │
                  ▼
       Both parties decrypt their balances locally
```

For full architecture see [README.md](README.md) or [PROJECT-SPEC.md](PROJECT-SPEC.md).

---

## Get Help

- **Issues:** https://github.com/PugarHuda/diam/issues
- **iExec Discord:** https://discord.gg/RXYHBJceMe (Vibe Coding Challenge channel)
- **Nox docs:** https://docs.iex.ec/nox-protocol/getting-started/welcome
