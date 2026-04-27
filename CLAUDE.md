# PrivateOTC — Claude Project Context

## What is this?

On-chain OTC desk dengan amount terenkripsi, built on iExec Nox confidential computing protocol. Submission untuk iExec Vibe Coding Challenge (deadline 2 Mei 2026).

## Project structure

```
private-otc/
├── packages/
│   ├── contracts/      # Solidity 0.8.27 + Foundry
│   ├── web/            # Next.js 16 frontend
│   ├── agents/         # Compound Engineering autonomous agents
│   └── mcp-server/     # MCP server exposing OTC as AI tool
└── .claude-plugin/     # Claude Code plugin companion (/otc-* commands)
```

## How to run

```bash
pnpm install                       # install all workspace deps
pnpm dev                            # run frontend
pnpm contracts:build                # build Solidity
pnpm contracts:test                 # foundry tests
pnpm contracts:deploy:sepolia       # deploy to Arbitrum Sepolia
pnpm agents:dev                     # run autonomous agents
pnpm mcp:dev                        # run MCP server
```

## Stack

| Layer | Tech |
|---|---|
| Contracts | Solidity 0.8.27 + Foundry + `@iexec-nox/nox-protocol-contracts` |
| Frontend | Next.js 16 (App Router) + wagmi v2 + RainbowKit + shadcn/ui |
| Encryption | `@iexec-nox/handle` (Viem v2) |
| AI | ChainGPT API |
| Agents | Vercel Cron + Functions, Node 22 |
| MCP | Model Context Protocol SDK |
| Network | Arbitrum Sepolia |

## Conventions

- **Solidity:** 0.8.27, NatSpec untuk public/external functions, Foundry tests dengan `forge test -vvv`
- **TypeScript:** strict mode, no `any`, ESM imports
- **Naming:** Solidity contracts PascalCase, TS files camelCase, components PascalCase
- **Frontend:** Server Components by default, "use client" hanya saat butuh wallet/state
- **Env vars:** `NEXT_PUBLIC_*` untuk frontend, no prefix untuk server
- **Encrypted types:** prefer `euint256` untuk amounts (overkill tapi konsisten)

## Key resources

- ANALYSIS.md (parent dir) — strategic analysis
- PROJECT-SPEC.md (parent dir) — full implementation spec
- feedback.md — feedback for iExec team (wajib brief)
- https://docs.iex.ec/nox-protocol — Nox docs
- https://docs.chaingpt.org — ChainGPT API docs

## What we're optimizing for

1. **End-to-end working on Arbitrum Sepolia** (NO MOCKS or DQ)
2. **4-minute demo video that has a wow moment** (Vickrey reveal)
3. **Clean, maintainable code** despite tight timeline
4. **Match institutional iExec narrative** ("composable, interoperable, auditable")

## What we're NOT building

- Full ERC-3643 (DQ trap if partial)
- Full ERC-7540 (DQ trap if partial)
- Full lending protocol (scope creep)
- Mainnet deploy (Sepolia only)
