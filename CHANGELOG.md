# Changelog

All notable changes to Diam (the Confidential OTC desk) leading up to the
iExec Vibe Coding Challenge submission.

## [Submission — May 2026]

### ✨ DiamReceipt — onchain ERC-721 keepsake

New contract `DiamReceipt.sol` deployed at
`0xE011E57ff89a9b1450551A7cE402b75c5Bd27B85` on Arbitrum Sepolia. Each
settled trade can be commemorated with an NFT minted to a participant's
wallet. Image + metadata are stored fully onchain — `tokenURI` returns
`data:application/json;base64,...` containing inline SVG with the trade's
pair, mode, intent ID, and settle tx hash. No IPFS, no off-chain image
host, no link rot.

Build trick: SVG/JSON construction is split across `_svgHead` / `_svgBody`
/ `_buildJson` helpers because `abi.encodePacked` consumes one stack slot
per arg — concatenating 13+ string fragments hits "Stack too deep". Each
helper stays under ~8 args and returns `bytes`.

Frontend single-click flow: `MINT RECEIPT` runs the ChainGPT image
generation, sets state, then a `useEffect` (gated by a `pendingMint`
flag) fires `DiamReceipt.mint(...)` only after the image has rendered.
Without the effect indirection, MetaMask would pop up before React
commits the image — the await race we hit and fixed.

Idempotency via `useExistingReceipt` reading past `ReceiptMinted(uint256
indexed tokenId, uint256 indexed intentId, address indexed minter, uint8
mode)` events filtered by `(intentId, minter)`. Once a participant has
minted, the button hides and the panel surfaces "MINTED #N" with an
Arbiscan token link instead.

Participant gating uses a separate `useSettledTaker` hook reading the
`Settled(id, taker)` event log — receipt mint UI only renders for the
maker (from intent struct), the actual Direct taker, or the RFQ winner.
Random visitors see a "Read-only view" notice.

### ✨ OperatorAuth + OperatorWarning UX

Settlement (`acceptIntent`, `revealRFQWinner`) calls
`confidentialTransferFrom` on both sides, so both holders must have
called `setOperator(PrivateOTC, until)` on the relevant cToken — missing
either side reverts with `DiamCToken: not operator`.

Pre-fix, the only place we mentioned this was a static text label on
`/faucet`. Result: every fresh wallet's first attempt at accept/reveal
reverted on mainnet gas, with no on-chain hint why.

Fix shipped in three pieces:
1. `useSetOperator` hook (read `isOperator` real-time + write
   `setOperator(OTC, +60d)`) and `useIsOperator` (read-only counterparty
   variant).
2. `<OperatorAuth>` self-side banner mounted on `/faucet`,
   `/create/direct`, `/create/rfq`, `/intents/[id]`, `/rfq/[id]`. Hides
   itself once `isOperator` flips true.
3. `<OperatorWarning>` red counterparty-side banner (intent / accept /
   reveal pages). Disables submit + tells the user *why* the trade would
   revert (e.g. "MAKER NOT AUTHORIZED — would revert"), instead of
   letting them pay gas for a doomed tx.

Plus seed wallets (alice/bob/carol/dave/eve/frank) authorized in batch
via `pnpm --filter agents tsx src/seed/seed-authorize-operators.ts` —
idempotent, safe to re-run after redeploys.

### ✨ Orderbook pagination + status diversity

`/intents` now paginates 10 rows per page with prev/next + page indicator.
URL param `?p=N` alongside the existing mode/status/pair/mine filters,
state resets to page 1 on filter change.

Demo data covers every state via `seed-mixed-statuses.ts`: Open Direct,
Filled Direct (alice creates → bob accepts), Cancelled Direct (dave),
Soon-Expired Direct (90s deadline), Open RFQ (frank), and PendingReveal
RFQ (alice creates → bob+carol bid → finalize). Every status badge in the
filter bar now resolves to real on-chain data.

### 🐛 Submit re-trigger on `done`

The four trade-action buttons (`createIntent`, `createRFQ`,
`acceptIntent`, `submitBid`) only checked `step === encrypting | signing
| confirming` for their disabled state. After step transitioned to
`done`, clicking the "BROADCAST COMPLETE" / "SETTLED ✓" label re-fired
the form submit — a second on-chain tx for the same intent / bid.

Fix adds `step === "done"` to every disabled list with a tooltip
explaining why ("Already broadcast — see the link above to view the
intent").

### 🐛 React Hooks order in detail pages

`useSetOperator` / `useIsOperator` / `useSettledTaker` initially sat
*after* the `if (intentQuery.isLoading) return ...` early return in
`/intents/[id]` and `/rfq/[id]`. React conditionally skipped them on the
loading render → "Rendered fewer hooks than expected" → SYSTEM_FAULT
error boundary.

Fixed by moving all operator-status / event-log hooks above any early
return and deriving inputs (`intentMaker`, `intentSellToken`,
`intentBuyToken`) from `intentQuery.data` with optional chaining. Hooks
tolerate `undefined` inputs via their internal `enabled` guards.

### 🧹 Removed ChainGPT auditor

The `/api/chaingpt/audit` route + `<AuditButton />` component on
`/create` were demo decoration — invocation rate was effectively zero
during testing and the audit output didn't drive any product decision.
Removed entirely; the remaining ChainGPT integrations (advisor, signal,
NFT receipt image) all surface in user-visible flows.

### 🎨 Brand

`--color-primary` `#00ff41` (matrix green) — matches the favicon
`app/icon.svg` (originally the only green surface). All component
classes already CSS-var-based, so the brand cascade was effectively a
single token change. The terminal/cyberpunk aesthetic suits the
"confidential intent / encrypted handle" copy better than the original
violet did.

---

## [Unreleased]

### 🔄 Breaking change

#### RFQ finalization is now 2-step: `finalizeRFQ` + `revealRFQWinner`

The original `finalizeRFQ` had a critical correctness gap: it returned
`winnerAddr = _bids[0].taker` (always the first bidder) regardless of who
actually had the highest bid. The encrypted second-price was correctly
computed, but the wrong bidder always received the goods — Vickrey
auctions only work when the *highest* bidder wins.

Root cause: Nox v0.2 doesn't expose an encrypted address type (`eaddress`),
so the highest-bidder index can't be tracked under encryption and revealed
as a plain value without a per-bid public-decryption ceremony.

**Fix:** split finalization into two functions:

1. `finalizeRFQ(id)` — anyone can call after the bidding deadline. Computes
   the encrypted second-price, transitions status to `PendingReveal`, and
   grants the maker `Nox.allow` access to every bid amount so they can
   decrypt off-chain via the auditor flow.
2. `revealRFQWinner(id, winnerIdx)` — maker-only. The maker decrypts each
   bid off-chain, identifies the actual highest bidder by index, and calls
   this function to trigger settlement at the encrypted second-price.

New `IntentStatus.PendingReveal` value, new `RFQPendingReveal` event, new
`InvalidWinnerIndex` and `NotPendingReveal` errors.

**Trust model:** the maker has weak game-theoretic incentive to misreport
the winner (price they receive is fixed by the encrypted second-price
regardless of who they pick), and reputational/social cost of off-chain
cheating is high. Future Nox versions with `eaddress` will let us close
this gap on-chain. Documented in `packages/contracts/SECURITY.md`.

### 🐛 Bug fixes

#### Vickrey second-price tracking — caught by tests

Found and fixed a real Vickrey-correctness bug in
`PrivateOTC._pickVickreyWinner`. The original loop:

```solidity
ebool isHigher = Nox.gt(candidate, highest);
second = Nox.select(isHigher, highest, second);  // ← bug
highest = Nox.select(isHigher, candidate, highest);
```

…lost any bid that fell **between** the current `second` and `highest`
because `second` only updated when a *new* highest came in. With bids
`[100, 300, 200]`, the contract would have charged the winner `100`
instead of the correct `200`.

The fix adds a middle-case branch:

```solidity
ebool isHigher = Nox.gt(candidate, highest);
ebool isMiddle = Nox.gt(candidate, second);

euint256 newSecondIfNotHigher = Nox.select(isMiddle, candidate, second);
second = Nox.select(isHigher, highest, newSecondIfNotHigher);
highest = Nox.select(isHigher, candidate, highest);
```

**How we caught it:** while writing a Vickrey-correctness fuzz test, we
mirrored the algorithm in plain `uint256` so we could verify it against
randomly-shuffled bid sets. The mirror failed the same way — proving the
bug was in the algorithm, not the encryption layer. 256 random fuzz runs
now confirm the corrected version: `highest = max(bids)` and
`second = strict-second-max(bids)` for every unique-bid set.

Verified on Arbitrum Sepolia fork against the real Nox precompile.

### ✨ Tests

- 30 local Forge tests (guard clauses + 15 Vickrey algorithm tests + 3 invariants)
- 30 Forge fork tests against real Nox (Strategy B + Vickrey fuzz + happy paths)
- 199 web Vitest tests (hooks logic + chaingpt + nox-client + utils + precision)
- 54 MCP server tests (3 tools)
- 57 agents tests (4 agent logic modules)
- **Total: 370 tests** across 4 packages

### 🏗 Architecture

- Extracted pure logic into `*.logic.ts` modules per hook/agent so React
  glue + RPC plumbing live separately from testable decisions.
- Shared `tsconfig.base.json` across web/mcp-server/agents.
- CI workflow (4 parallel jobs) with gas snapshot regression check
  and Codecov upload.
- `pnpm@10`, Node 22 pinned via `.nvmrc` + `engines`.
- husky + lint-staged pre-commit hook running per-package type-check
  on staged files.

### 🐛 Other notable

- Fixed `Number(buy)/Number(sell)` precision smell — replaced with
  `safeUnitPrice` / `safeDeltaBps` helpers that guard NaN/Infinity/zero
  and lock IEEE 754 rounding behavior in tests.
- Removed `await import("./precision")` async dynamic import from
  `chaingpt.ts` (always-async cost on every fair-price call).
- Moved `setStep("done")` calls into `useEffect` (was calling setState
  during render — React 19 anti-pattern).
- Replaced hardcoded `NOX_PROXY = 0xd464...` with `Nox.noxComputeContract()`
  so fork tests survive Nox redeploys.
