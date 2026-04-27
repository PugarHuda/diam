# Agents Package — Compound Engineering Layer

## What is this?

Autonomous agents yang "compound" trader's edge dengan jalan terus-menerus, menjaga privasi via Nox, sementara user fokus ke strategi tinggi-level.

## Agents

| Agent | Trigger | Job |
|---|---|---|
| `market-maker` | viem watchContractEvent on `IntentCreated` | Auto-bid pada RFQ matching strategy |
| `rfq-sweeper` | setInterval 5 min | Finalize expired RFQs |
| `strategy-coach` | daily cron | ChainGPT-powered trade analysis |
| `settlement-monitor` | viem watchContractEvent on `Settled` | Post-trade audit + webhook |

## Stack

- **Runtime:** Node 22 ESM
- **Lang:** TypeScript strict, tsx for dev
- **RPC:** viem v2
- **Encryption:** `@iexec-nox/handle`
- **State:** Vercel KV (encrypted strategy params)
- **AI:** ChainGPT API
- **Validation:** zod
- **Hosting:** Vercel Cron + Functions, atau standalone

## Conventions

- ESM only (`"type": "module"`, `.js` extensions in imports)
- Each agent exports `start{Name}()` function
- All env vars validated via zod at startup — fail fast
- Logs prefixed `[agent-name]` for grep-ability
- No `console.log` di production path — pakai pino/structured logger

## Run

```bash
pnpm dev                       # all agents in watch mode
pnpm market-maker              # individual agent
pnpm build && pnpm start       # production
```

## Env

```
AGENT_PRIVATE_KEY              # bot wallet (separate from user)
ARBITRUM_SEPOLIA_RPC_URL
CHAINGPT_API_KEY
AGENT_NOTIFICATION_WEBHOOK     # Slack/Discord webhook
KV_REST_API_URL
KV_REST_API_TOKEN
```

## Don't

- DON'T share `AGENT_PRIVATE_KEY` with user wallet — separate key for separate concerns
- DON'T decrypt user data without explicit auditor permission (Nox.addViewer)
- DON'T poll RPC every second — use viem `watchContractEvent` (subscription)
