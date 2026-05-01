# Diam — Claude Project Context

## What is this?

On-chain OTC desk with encrypted amounts, built on the iExec Nox confidential computing protocol. Submission for the iExec Vibe Coding Challenge (deadline 2 May 2026).

## Project structure

```
private-otc/
├── packages/
│   ├── contracts/      # Solidity 0.8.27 + Foundry
│   │                   # PrivateOTC + DiamCToken (cUSDC, cETH) + DiamReceipt (ERC-721)
│   ├── web/            # Next.js 16 frontend
│   ├── agents/         # Compound Engineering autonomous agents + seed scripts
│   └── mcp-server/     # MCP server exposing OTC as AI tool
└── .claude-plugin/     # Claude Code plugin companion (/otc-* commands)
```

## Deployed contracts (Arbitrum Sepolia)

| Contract | Address | env var |
|---|---|---|
| PrivateOTC | `0x5b2C0c83e41bF9ef072d742096C49DFDB814CEB4` | `NEXT_PUBLIC_PRIVATE_OTC_ADDRESS` |
| cUSDC | `0x57736B816F6cb53c6B2c742D3A162E89Db162ADE` | `NEXT_PUBLIC_CUSDC_ADDRESS` |
| cETH | `0xCdD84bA9415DFE3Dd5c0c05077B1FE194Bcf695d` | `NEXT_PUBLIC_CETH_ADDRESS` |
| DiamReceipt | `0xE011E57ff89a9b1450551A7cE402b75c5Bd27B85` | `NEXT_PUBLIC_DIAM_RECEIPT_ADDRESS` |

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
| Contracts | Solidity 0.8.27 + Foundry + `@iexec-nox/nox-protocol-contracts` + OpenZeppelin (ERC-721) |
| Frontend | Next.js 16 (App Router) + wagmi v2 + RainbowKit + shadcn/ui |
| Encryption | `@iexec-nox/handle` (Viem v2) |
| AI | ChainGPT API (advisor / signal / receipt image only — auditor was removed) |
| Receipt NFT | ERC-721 with fully onchain Base64 SVG metadata (no IPFS) |
| Agents | Vercel Cron + Functions, Node 22 |
| MCP | Model Context Protocol SDK |
| Network | Arbitrum Sepolia |

## Conventions

- **Solidity:** 0.8.27, NatSpec on public/external functions, Foundry tests with `forge test -vvv`
- **TypeScript:** strict mode, no `any`, ESM imports
- **Naming:** Solidity contracts PascalCase, TS files camelCase, components PascalCase
- **Frontend:** Server Components by default, `"use client"` only when wallet/state is needed
- **Env vars:** `NEXT_PUBLIC_*` for the frontend, no prefix for server-only
- **Encrypted types:** prefer `euint256` for amounts (overkill but consistent)

## Key resources

- ANALYSIS.md (parent dir) — strategic analysis
- PROJECT-SPEC.md (parent dir) — full implementation spec
- feedback.md — feedback for the iExec team (keep it brief)
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

## Operator authorization invariant

Settlement (`acceptIntent`, `revealRFQWinner`) calls
`confidentialTransferFrom` on **both** sides. Both holders must have
called `setOperator(PrivateOTC, until)` on the relevant cToken **before**
settle, otherwise `_settleAtomic` reverts with "DiamCToken: not operator".

UI surfaces this end-to-end:
- `OperatorAuth` (self side): banner with one-click authorize, mounted on
  `/faucet`, `/create/direct`, `/create/rfq`, `/intents/[id]`, `/rfq/[id]`.
- `OperatorWarning` (counterparty side): red blocker on `/intents/[id]`
  if the maker hasn't authorized sellToken; per-bidder badges on
  `/rfq/[id]` reveal panel. Disables submit/pick instead of letting the
  user pay gas for a doomed tx.
- Seed wallets (alice/bob/carol/dave/eve/frank) authorized by
  `pnpm --filter agents tsx src/seed/seed-authorize-operators.ts`
  — idempotent, safe to re-run.
