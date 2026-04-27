# Web Package — PrivateOTC Frontend

## Stack

- **Framework:** Next.js 16 (App Router) + Turbopack
- **Wallet:** wagmi v2 + RainbowKit
- **Encryption:** `@iexec-nox/handle` (Viem v2 client)
- **UI:** Tailwind CSS v4 (CSS-based config in `globals.css`)
- **AI:** Vercel AI SDK + ChainGPT API
- **Deploy:** Vercel

## Structure

```
app/
├── page.tsx                # Landing
├── layout.tsx              # Root layout, fonts, providers
├── providers.tsx           # WagmiProvider + RainbowKitProvider + ReactQuery
├── globals.css             # Tailwind + theme tokens (CSS variables)
├── intents/                # Browse + detail
├── create/                 # Create OTC intent or RFQ
├── rfq/                    # RFQ detail + bid form
├── portfolio/              # User's intents/bids + decrypt
└── audit/                  # Public audit view per tx

components/
├── Header.tsx
├── EncryptedAmountInput.tsx
├── DecryptableBalance.tsx
├── RFQBidList.tsx
├── VickreyRevealAnimation.tsx
└── ChainGPTAdvisor.tsx

lib/
├── wagmi.ts                # Wagmi config + contract addresses
├── nox-client.ts           # Encryption SDK wrapper
├── chaingpt.ts             # ChainGPT API client
└── utils.ts                # cn(), shortAddress(), etc.
```

## Conventions

- **Server Components by default.** Add `"use client"` only when needed (wallet, hooks, animation, state).
- **Tailwind v4:** theme tokens in `globals.css` via `@theme {}`. Use `var(--color-*)` directly in className — NOT old `bg-{color}` shorthand for custom colors.
- **Numbers:** add `data-numeric` or `font-mono` for tabular-nums alignment.
- **Imports:** path alias `@/*` maps to package root (e.g., `@/lib/wagmi`).
- **Forms:** prefer Server Actions for non-wallet ops, client components for wallet sigs.
- **Encrypted inputs:** ALWAYS encrypt off-chain via `nox-client.encryptInput()` before passing to contract write.

## Environment Variables

Need `NEXT_PUBLIC_*` for client, others server-only:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID    # Reown/WC project id
NEXT_PUBLIC_PRIVATE_OTC_ADDRESS         # Deployed contract address
NEXT_PUBLIC_CUSDC_ADDRESS               # cUSDC token address
NEXT_PUBLIC_CETH_ADDRESS                # cETH token address
NEXT_PUBLIC_NOX_NETWORK                 # arbitrum-sepolia
NEXT_PUBLIC_NOX_HANDLE_GATEWAY_URL      # Nox gateway endpoint

CHAINGPT_API_KEY                        # Server-side AI calls
```

## How to run

```bash
pnpm install                # at workspace root
pnpm dev                    # Next dev with Turbopack on http://localhost:3000
pnpm build                  # production build
pnpm type-check             # tsc --noEmit
pnpm lint                   # next lint
```

## Design System

- **Theme:** Stark minimal + gradient trust (navy → soft purple)
- **Primary:** `--color-accent` `#7c3aed` (violet-600)
- **Bg:** `--color-bg` `#0a0a0f` (near-black)
- **Surface:** `--color-surface` `#12121a`
- **Font:** Inter (UI) + JetBrains Mono (numbers)
- **Tone:** institutional confident — bukan playful crypto
- **Hero copy:** "Your trade. Their guess. Nobody knows."

## Don't

- DON'T expose private keys client-side
- DON'T render user balances without `<DecryptableBalance>` wrapper
- DON'T use `any` — strict mode is enabled
- DON'T fetch encrypted values in Server Components — they need wallet sig
