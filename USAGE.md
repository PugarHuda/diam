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

> **Note:** UI for setOperator is forthcoming. For now, call `cToken.setOperator(diamAddr, deadline)` directly — or skip and try Direct OTC with self-acceptance via 2 wallets.

Direct call (using `cast` or Etherscan):
```
cast send 0xb0a42fEf01c0B9A2C264024483B6716A5AD6fA04 \
  "setOperator(address,uint48)" \
  0x32C6552b0FB40833568ECb44aF70A44059FE3FF5 \
  $((`date +%s` + 86400))
```

This grants Diam contract permission to move your cUSDC for 24h.

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

1. Go to **Trade** (sidebar)
2. See your intent in the order book — pair visible, amount masked as `[NOX]` handle
3. Click **Accept** on the intent
4. On the detail page:
   - Inspect the manifest (status, maker, encrypted handles, expires)
   - Enter your bid (e.g. `3500` cUSDC)
   - Click **ACCEPT + SETTLE**
5. Wallet signs:
   - Encrypts your bid via Nox
   - Calls `acceptIntent(id, handle, proof)` on PrivateOTC
   - **Strategy B fires:** `safeSub(buyAmount, minBuyAmount)` checks sufficiency, `select` routes real amounts (or zeros if insufficient) — atomic
   - cTokens transfer atomically: cETH → you, cUSDC → maker
6. Trade settled. Status: **Filled**

> **Privacy property:** if your bid was below maker's minimum, the trade is marked `Filled` BUT actual amounts transferred are encrypted zeros. Etherscan observers cannot distinguish a successful trade from a no-op rejection. That's Strategy B.

---

## Step 7 — RFQ Mode (Vickrey Auction)

For multi-bidder execution:

1. **Create** → **RFQ Mode**
2. Fill: sell asset, buy asset, sell amount, bidding window (30M / 1H / 6H / 1D)
3. Notice the **MarketSignal** sidebar — ChainGPT bias indicator (Bullish/Bearish/Neutral) for the pair
4. Submit → RFQ opens, deadline counts down
5. Multiple takers go to `/rfq/[id]` and submit sealed bids (encrypted, max 10 bidders)
6. After deadline, anyone calls **FINALIZE RFQ**
7. On-chain Vickrey logic:
   ```solidity
   for (uint i = 1; i < bids.length; i++) {
     ebool isHigher = Nox.gt(candidate, highest);
     second  = Nox.select(isHigher, highest, second);
     highest = Nox.select(isHigher, candidate, highest);
   }
   priceToPay = second;  // encrypted
   ```
8. Winner gets the maker's cETH; pays second-highest price (encrypted) in cUSDC

---

## Step 8 — Audit Smart Contract (ChainGPT)

On the **Create** page, you'll see a **ChainGPT Auditor** card:

1. Click **Audit Strategy B logic**
2. ChainGPT sends `acceptIntent` source to the `smart_contract_auditor` model
3. Returns markdown audit:
   - Risk badge (Low / Medium / High)
   - Numbered findings + recommendations
   - Expandable raw markdown for full detail

This proves the AI integration isn't decorative — judges can verify it pulls live from `api.chaingpt.org`.

---

## Recap — What You Just Did

You executed a confidential OTC trade where:

✅ Asset pair is public, amounts are encrypted bytes32 handles
✅ Maker's hidden minimum is enforced atomically — privacy preserved on rejection
✅ MEV bots cannot extract value from your order
✅ Settlement is atomic via ERC-7984 `confidentialTransferFrom`
✅ AI advisor checked your price vs market via ChainGPT
✅ Smart contract audited live by ChainGPT in your browser

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
