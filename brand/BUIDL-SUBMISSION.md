# Diam — DoraHacks BUIDL Submission Copy

> Paste-ready text for the DoraHacks "Create a new BUIDL" form.

---

## BUIDL name
```
Diam
```

## Tagline (one-liner under the name, if asked)
```
Confidential OTC desk where the trade amount stays sealed on-chain.
```

> *Diam* = "diamond" + Indonesian *diam* ("silent / quiet"). The protocol keeps your order quiet.

---

## BUIDL logo
- File to upload: `brand/diam-logo-480.png` (export from `brand/export-png.html`).
- Source SVG: `brand/diam-logo-480.svg`.
- Already 480×480, well under 2 MB. PNG re-export keeps the matrix-green-on-black palette identical to the dApp.

---

## Vision — 256-char limit (paste this if the form caps at 256)

**Recommended (222 chars):**

```
Confidential OTC on iExec Nox. Trade amounts stay encrypted on-chain via TEE; a sealed-bid Vickrey RFQ settles without leaking losing bids. Institutional size privacy, fully on-chain. Your trade. Their guess. Nobody knows.
```

**Backup options at varying lengths:**

| Char | Use when |
|---|---|
| 125 | Tagline / hero one-liner field |
| 153 | Twitter bio length |
| 175 | If you want to drop the "Your trade. Their guess." cadence |
| **222** ★ | Primary 256-char Vision field — recommended |
| 229 | Same as 222 but explicitly leads with "Diam is a…" |

```
125: Confidential OTC on iExec Nox. Encrypted amounts, sealed Vickrey bids, fully on-chain. Your trade. Their guess. Nobody knows.

153: Diam: confidential OTC on iExec Nox. Encrypted order amounts + sealed-bid Vickrey RFQ that hides losing bids. Institutional size privacy, fully on-chain.

175: Confidential OTC on iExec Nox. Order amounts stay encrypted on-chain; a sealed-bid Vickrey RFQ settles without leaking losing bids. Institutional size privacy, fully on-chain.

229: Diam is a confidential OTC desk on iExec Nox. Order amounts stay encrypted on-chain; a sealed-bid Vickrey RFQ settles without leaking losing bids. Institutional size privacy, fully on-chain. Your trade. Their guess. Nobody knows.
```

## Vision — SHORT (≈ 80 words, for fields with looser limits)

> On-chain OTC desks leak everything: order size, side, and price all sit in plaintext, so every MEV bot and competing desk sees the trade the moment it lands. That is why >95% of institutional OTC volume still happens off-chain on Telegram and centralized desks. **Diam** is a confidential OTC desk on iExec Nox that keeps the trade amount encrypted *on-chain* through TEE-backed `euint256` handles, and runs a sealed-bid Vickrey RFQ whose winner and clearing price are computed entirely on encrypted handles — only the result is revealed.

## Vision — LONG (3 paragraphs, paste into the main "Vision" field)

> **The problem.** On-chain OTC desks today leak everything. Order size, side, counterparty, and price all sit in plaintext on the blockchain — meaning every market maker, MEV bot, and competing desk sees your trade intent the moment it lands. That is why >95% of institutional OTC volume still happens off-chain in private Telegram chats and centralized desks (Genesis, Cumberland, FalconX). The on-chain alternatives — 1inch RFQ, CoW Protocol, Hashflow — protect you from MEV at execution time, but the *order itself* remains public information from the second it is posted. For an institutional desk moving 8-figure size, that is a non-starter: a leaked $50M ETH sell order moves the market against the maker before they have a chance to execute.
>
> **What Diam does.** Diam is a confidential OTC desk built on iExec's Nox protocol. Every trade amount is encrypted *on-chain* using TEE-backed `euint256` handles. Makers post intents with sealed sizes; takers fill them blind. For RFQ flows, Diam runs a sealed-bid Vickrey second-price auction whose winner selection and clearing price are computed entirely on encrypted handles inside Nox precompiles — only the winner address and the final clearing price are ever revealed. Settlement happens atomically through `Nox.safeSub` + `Nox.select`, so a taker either pays in full and receives the asset, or the trade reverts — there is no partial-leak failure mode.
>
> **Why it matters.** Diam ports the most valuable property of off-chain OTC desks — *size privacy* — into a fully on-chain, auditable, composable venue. Institutional desks get the discretion they need to move size without front-running; counterparties get the settlement guarantees of a smart contract; regulators get an auditable receipt for every fill. The protocol ships with end-to-end Arbitrum Sepolia deployment, a Next.js dApp, four autonomous agents (market-maker, RFQ sweeper, settlement monitor, strategy coach), an MCP server exposing the desk as an AI-callable tool, and a Foundry test suite that caught a non-trivial Vickrey middle-case bug via fuzzed pure-Solidity mirrors of the encrypted algorithm.

---

## Category

**Primary:** `DeFi`
**Secondary (if multi-select allowed):** `Privacy / Confidential Computing`, `Infrastructure`

> Diam is a DeFi trading venue at the surface, but the core value prop — *confidentiality of trade size* — is a privacy/TEE story. Lead with DeFi because that is the user-facing wedge; mention privacy because that is the technical moat.

---

## Tagline bank (in case the form has more fields)

| Slot | Copy |
|---|---|
| Hero one-liner | "Your trade. Their guess. Nobody knows." |
| Elevator | "Diam is a confidential OTC desk on Arbitrum where the trade amount is encrypted on-chain via iExec Nox. Makers post sealed intents, takers fill them blind, and an encrypted Vickrey auction picks the winner without leaking losing bids." |
| Twitter bio | "Confidential OTC on-chain. Sealed amounts, sealed bids, sealed wins. Built on @iEx_ec Nox." |
| Demo hook | "We took the part of OTC that institutions actually care about — size privacy — and put it on Arbitrum." |

---

## Repo / links section (if asked)

| Field | Value |
|---|---|
| GitHub | https://github.com/PugarHuda/diam |
| Live demo | https://private-otc.vercel.app |
| Demo video | https://youtu.be/_tMBT32r_kQ |
| Twitter post | https://x.com/BangDropID/status/2050295042296984047 |
| Network | Arbitrum Sepolia (chain id 421614) |
| PrivateOTC contract | `0x5b2C0c83e41bF9ef072d742096C49DFDB814CEB4` |
| cUSDC | `0x57736B816F6cb53c6B2c742D3A162E89Db162ADE` |
| cETH | `0xCdD84bA9415DFE3Dd5c0c05077B1FE194Bcf695d` |
| DiamReceipt | `0xE011E57ff89a9b1450551A7cE402b75c5Bd27B85` |
| NoxCompute proxy (iExec) | `0xd464B198f06756a1d00be223634b85E0a731c229` |

---

## Brand palette (for any later "media kit" question)

| Token | Hex | Use |
|---|---|---|
| Background | `#131313` | Page bg |
| Surface | `#1a1a1a` | Cards |
| Primary (matrix green) | `#00ff41` | Brand mark, primary CTA |
| Primary fg | `#002203` | Text on green buttons |
| Muted | `#84967e` | Secondary copy |
| Foreground | `#e5e2e1` | Body text |

Fonts: **Space Grotesk** (display + mono) / **Inter** (body).
