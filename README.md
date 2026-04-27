# Diam

> **Your trade. Their guess. Nobody knows.**

`diam` — Indonesian for *"silent"*. A confidential OTC desk where amounts stay hidden, bids stay sealed, and trades stay quiet.

On-chain OTC desk with hidden amounts and Vickrey-fair price discovery, built on the iExec Nox confidential computing protocol.

Submission for the [iExec Vibe Coding Challenge](https://dorahacks.io/hackathon/vibe-coding-iexec) (April–May 2026).

| | |
|---|---|
| 🚀 **Live demo** | https://private-otc.vercel.app |
| 📦 **Source** | https://github.com/PugarHuda/diam |
| 📡 **Network** | Arbitrum Sepolia (chain id `421614`) |
| 🔑 **Stack** | Next.js 16 · Solidity 0.8.27 · iExec Nox · ChainGPT · MCP |

---

## Why Diam exists

When a whale wants to swap 1,000 ETH for USDC on-chain today, they hit two walls:

1. **Public DEX** (Uniswap, Curve, etc.) — ~8% slippage on size, MEV sandwich attacks, leaked alpha as the order sits in the mempool.
2. **OTC desk via Telegram** (GSR, Cumberland, Wintermute) — manual chat, fiat wires, no audit trail, full counterparty trust.

**$30B+ flows through OTC desks every month.** All of it via Telegram, in 2026.

Diam is the third option: **on-chain OTC where amounts are encrypted end-to-end**.

- ✅ Settlement on-chain via ERC-7984 confidential tokens
- ✅ Direct OTC (1 maker ↔ 1 taker) **or** RFQ Mode (1 maker ↔ N takers, Vickrey pricing)
- ✅ Atomic settlement, no trusted intermediary
- ✅ Composable with any ERC-20 through the Nox Confidential Token wrapper
- ✅ Auditable via selective ACL disclosure — regulators can decrypt logs through key sharing

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│  MCP Plugin Layer                       │
│  AI agents (Claude / Cursor / ChainGPT) │ ──► Trade through Diam
│  call Diam via standardized MCP tools   │     with one prompt
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Compound Engineering Layer             │
│  Autonomous agents: MarketMaker,        │ ──► Long-running bots
│  Settlement Monitor, Strategy Coach,    │     bid, sweep, analyze
│  RFQ Sweeper                            │
└─────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  Core Protocol                          │
│  Solidity (Nox library) + Next.js UI    │ ──► Direct OTC + Vickrey
│  ERC-7984 cToken settlements            │     RFQ on Arbitrum
└─────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| Smart Contracts | Solidity 0.8.27 · Foundry · [`@iexec-nox/nox-protocol-contracts@0.2.2`](https://www.npmjs.com/package/@iexec-nox/nox-protocol-contracts) |
| Confidential primitives | iExec Nox (TEE-based) · NoxCompute proxy on Arbitrum Sepolia |
| Encryption | [`@iexec-nox/handle@0.1.0-beta.10`](https://www.npmjs.com/package/@iexec-nox/handle) — Viem v2 client |
| Frontend | Next.js 16 (App Router · Turbopack) · wagmi v2 · RainbowKit · Tailwind v4 |
| AI | ChainGPT API — smart contract auditor, fair-price advisor, settlement reports |
| Autonomous agents | Node 22 · viem `watchContractEvent` · Vercel Cron + Functions |
| MCP server | `@modelcontextprotocol/sdk` · stdio transport |
| Hosting | Vercel (production) |

---

## Project Structure

```
diam/
├── packages/
│   ├── contracts/        # Solidity + Foundry (PrivateOTC.sol on-chain)
│   ├── web/              # Next.js frontend
│   ├── agents/           # Compound Engineering autonomous agents
│   └── mcp-server/       # MCP server exposing OTC as AI-native tools
├── .claude-plugin/       # Claude Code plugin companion (/otc-* slash commands)
├── feedback.md           # Builder feedback for the iExec Nox team
├── DEMO-SCRIPT.md        # 4-minute demo video storyboard
├── X-POST.md             # Submission post drafts
└── README.md             # This file
```

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Foundry: `curl -L https://foundry.paradigm.xyz | bash`
- A wallet with Arbitrum Sepolia ETH ([Alchemy faucet](https://www.alchemy.com/faucets/arbitrum-sepolia))
- A ChainGPT API key (free hackathon credits via Telegram `@vladnazarxyz`)

### Install

```bash
git clone https://github.com/PugarHuda/diam.git
cd diam
pnpm install
cp .env.example .env
# Fill .env with your values (see .env.example for the full list)
```

### Run the frontend

```bash
pnpm dev
# Open http://localhost:3000
```

### Build, test, and deploy contracts

```bash
pnpm contracts:build         # forge build
pnpm contracts:test          # forge test (local) — fork tests skip-by-default
pnpm contracts:deploy:sepolia
```

### Run agents

```bash
pnpm agents:dev              # all 4 agents in watch mode
pnpm --filter agents market-maker   # individual agent
```

### Run the MCP server

```bash
pnpm mcp:dev                 # stdio transport, ready for Claude Code / Cursor
```

---

## End-to-End Demo (5 minutes)

1. Visit [https://private-otc.vercel.app](https://private-otc.vercel.app)
2. Connect a wallet on **Arbitrum Sepolia**
3. Go to **Faucet** → mint 10,000 cUSDC and 10 cETH (encrypted via Nox)
4. Go to **Portfolio** → click **Decrypt** to confirm the JS SDK can read your hidden balance
5. Approve the Diam contract as an operator on each cToken (one-time, in your wallet)
6. **Create Intent** → Direct OTC: sell 1 cETH for at least 3,500 cUSDC
7. With another wallet, browse **Intents** → **Accept** with a bid
8. Both parties decrypt their new balances on **Portfolio**

The transaction shows up on Etherscan — but the amount is a 32-byte handle, not a number.

---

## Deployed Contracts (Arbitrum Sepolia)

| Contract | Address |
|---|---|
| `PrivateOTC` (the Diam orchestrator) | [`0x32C6552b0FB40833568ECb44aF70A44059FE3FF5`](https://sepolia.arbiscan.io/address/0x32C6552b0FB40833568ECb44aF70A44059FE3FF5) |
| `cUSDC` (mock ERC-7984) | [`0xb0a42fEf01c0B9A2C264024483B6716A5AD6fA04`](https://sepolia.arbiscan.io/address/0xb0a42fEf01c0B9A2C264024483B6716A5AD6fA04) |
| `cETH` (mock ERC-7984) | [`0x6c745b2A55d7e7b48B226a33c65a5912ECC54630`](https://sepolia.arbiscan.io/address/0x6c745b2A55d7e7b48B226a33c65a5912ECC54630) |

**NoxCompute proxy** (provided by iExec): [`0xd464B198f06756a1d00be223634b85E0a731c229`](https://sepolia.arbiscan.io/address/0xd464B198f06756a1d00be223634b85E0a731c229)

> The on-chain contract name remains `PrivateOTC` (immutable). "Diam" is the user-facing brand and product name.

---

## Key Design Decision — Strategy B: Atomic Conditional Settlement

When a taker bid falls below the maker's hidden minimum, naive contracts either:
- ❌ Revert (leaks "bid too low" via the failed transaction), or
- ❌ Trust the client to validate (defeats the purpose of confidentiality)

Diam uses **`Nox.safeSub` + `Nox.select`** to make the trade an atomic no-op when the bid is insufficient:

```solidity
(ebool sufficient, ) = Nox.safeSub(buyAmount, intent.minBuyAmount);

euint256 zero = Nox.toEuint256(0);
euint256 effectiveSell = Nox.select(sufficient, intent.sellAmount, zero);
euint256 effectiveBuy  = Nox.select(sufficient, buyAmount,        zero);

// Always settle. Whether amounts are real or zero stays encrypted.
intent.sellToken.confidentialTransferFrom(maker, taker, euint256.unwrap(effectiveSell));
intent.buyToken.confidentialTransferFrom(taker, maker, euint256.unwrap(effectiveBuy));
intent.status = IntentStatus.Filled;
```

The branch (real vs zero) lives entirely inside encrypted handles. The on-chain status is always `Filled` — observers cannot distinguish a successful trade from a no-op rejection. **Privacy preserved on rejection.**

---

## What's Real vs. Mock

Per hackathon brief: *"using mock data leads to disqualification"*. Honest audit:

✅ **Real (verified on-chain)**
- All three contracts deployed and responding to read calls
- `cUSDC.confidentialTotalSupply()` returns a real Nox handle (NoxCompute proxy actually responded during constructor)
- `@iexec-nox/handle` and `@iexec-nox/nox-protocol-contracts` are the real iExec packages from npm
- Vickrey logic compiles against the real Nox library
- Frontend lives at https://private-otc.vercel.app, returns HTTP 200 on every route

🛠️ **Self-deployed (real, but written by us)**
- `MockCToken.sol` — a minimal ERC-7984 implementation (~150 LOC) using real `Nox.transfer` / `Nox.mint` primitives. We deployed it because the [`cdefi.iex.ec`](https://cdefi.iex.ec) faucet does not publicly expose token addresses. Implements all 8 ERC-7984 transfer functions and the operator pattern with `uint48` timestamp expiry.

There is **no fake data** anywhere. Every encrypted handle is a real reference to TEE-encrypted state.

---

## Documentation

- [ANALYSIS.md](ANALYSIS.md) — strategic analysis and decision rationale
- [PROJECT-SPEC.md](PROJECT-SPEC.md) — full implementation specification
- [feedback.md](feedback.md) — builder feedback for the iExec Nox team
- [DEMO-SCRIPT.md](DEMO-SCRIPT.md) — 4-minute demo video storyboard
- [X-POST.md](X-POST.md) — submission post drafts

---

## License

MIT
