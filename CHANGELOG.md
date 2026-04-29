# Changelog

All notable changes to Diam (the Confidential OTC desk) leading up to the
iExec Vibe Coding Challenge submission.

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
