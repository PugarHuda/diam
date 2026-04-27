# PrivateOTC

> **Your trade. Their guess. Nobody knows.**

On-chain OTC desk with hidden amounts and Vickrey-fair price discovery, built on iExec Nox confidential computing protocol.

Submission untuk [iExec Vibe Coding Challenge](https://dorahacks.io/hackathon/vibe-coding-iexec) (April-Mei 2026).

---

## What is PrivateOTC?

Whales dan institusi yang mau swap large size hari ini punya 2 pilihan, both buruk:

1. **Public DEX (Uniswap, dst.)** — slippage tinggi, MEV sandwich, sinyal pasar bocor
2. **OTC desk via Telegram (GSR, Cumberland)** — manual, no audit trail, butuh trust

PrivateOTC adalah opsi ketiga: **on-chain OTC dengan amount terenkripsi**.

- Settlement on-chain via ERC-7984 confidential tokens
- Direct OTC (1 maker ↔ 1 taker) atau RFQ Mode (1 maker ↔ N taker, Vickrey pricing)
- Atomic settlement, no trusted intermediary
- Composable dengan any ERC-20 lewat Nox Confidential Token wrapper
- Auditable via selective ACL disclosure (regulator dapat dekripsi log via key sharing)

## Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│  MCP Plugin Layer                       │
│  AI agents (Claude/Cursor/ChainGPT) ────┼──► Standardized MCP tools
│  call PrivateOTC via standardized tools │   for AI-native trading
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  Compound Engineering Layer             │
│  Autonomous agents: MarketMaker,        │
│  Settlement Monitor, Strategy Coach,    │
│  RFQ Sweeper                            │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│  Core Protocol                          │
│  Solidity contracts (Nox)  +  Frontend  │
│  ERC-7984 cToken settlements            │
└─────────────────────────────────────────┘
```

## Tech Stack

| Layer | Tech |
|---|---|
| Smart Contracts | Solidity 0.8.27, Foundry, `@iexec-nox/nox-protocol-contracts` |
| Frontend | Next.js 16 (App Router), wagmi v2, RainbowKit, shadcn/ui, Tailwind |
| Encryption | `@iexec-nox/handle` (Viem v2 client) |
| AI | ChainGPT API (auditor + price advisor) |
| Compound Agents | Vercel Cron + Functions, Node 22 |
| MCP Server | Model Context Protocol SDK |
| Hosting | Vercel |
| Network | Arbitrum Sepolia |

## Project Structure

```
private-otc/
├── packages/
│   ├── contracts/      # Solidity + Foundry
│   ├── web/            # Next.js frontend
│   ├── agents/         # Compound Engineering autonomous agents
│   └── mcp-server/     # MCP server exposing OTC as AI tool
├── .claude-plugin/     # Claude Code plugin companion
├── feedback.md         # Feedback for iExec Nox team
└── README.md           # This file
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- Wallet with Arbitrum Sepolia ETH (faucet: https://sepoliafaucet.com)
- Test cTokens (faucet: https://cdefi.iex.ec)
- ChainGPT API key (DM @vladnazarxyz on Telegram for free credits)

### Install

```bash
pnpm install
cp .env.example .env
# Fill .env with your values
```

### Run Frontend

```bash
pnpm dev
# Open http://localhost:3000
```

### Run Contracts

```bash
pnpm contracts:build
pnpm contracts:test
pnpm contracts:deploy:sepolia
```

### Run Agents

```bash
pnpm agents:dev
```

### Run MCP Server

```bash
pnpm mcp:dev
```

## Demo

[TODO: link ke 4-min demo video]

## Deployed Contracts (Arbitrum Sepolia)

- `PrivateOTC`: [TODO: address after deploy]
- Uses `cUSDC` from cdefi.iex.ec faucet
- Uses `cETH` from cdefi.iex.ec faucet

## Documentation

- [ANALYSIS.md](../ANALYSIS.md) — Strategic analysis & decision rationale
- [PROJECT-SPEC.md](../PROJECT-SPEC.md) — Full implementation spec
- [feedback.md](feedback.md) — Feedback for iExec Nox team

## License

MIT
