# Feedback on iExec Nox Protocol

> A Diam builder's experience during the iExec Vibe Coding Challenge (April–May 2026).
> Written after shipping: 5 git commits, 4-package monorepo, 3 contracts deployed on Arbitrum Sepolia.

## Builder Context

- **Project:** Diam — confidential OTC desk with Vickrey RFQ + Compound Engineering agents + MCP server
- **Stack:** Solidity 0.8.27 + Foundry, Next.js 16 + Viem, `@iexec-nox/handle@0.1.0-beta.10`, `@iexec-nox/nox-protocol-contracts@0.2.2`
- **Network:** Arbitrum Sepolia
- **Primary tools:** Claude Code (vibe coding), ChainGPT API
- **Total LOC:** ~3,800 lines across 4 packages

## What Worked Well

### The Hello World tutorial is excellent
The Piggy Bank tutorial at `docs.iex.ec/nox-protocol/getting-started/hello-world` is the best on-ramp to Nox. It's progressive: write a regular contract first, then convert it to confidential. Every change is explained with rationale. That's what helped me quickly grok the `Nox.fromExternal` + `Nox.allowThis` + `Nox.allow` pattern.

### `Nox.transfer/mint/burn` primitives are elegant
`Nox.transfer(senderBalance, receiverBalance, amount) → (success, newSender, newReceiver)` is very clean — atomic, returns updated balances + a success ebool. I used it directly in DiamCToken to implement ERC-7984 in ~180 lines. That's far more concise than FHE-based implementations.

### TypeScript SDK branded types
`Handle<T>` in `@iexec-nox/handle` is defined as `HexString & { __solidityType?: T }` — a branded type that preserves type info from off-chain encrypt all the way to the contract write. TypeScript catches errors at compile time even though the runtime value is just a 32-byte hex. The DX is excellent.

### A consistent Solidity Library API
Every operation (`add`, `sub`, `eq`, `gt`, `select`) has overloads for every type (`euint16`, `euint256`, `eint16`, `eint256`). Consistent and predictable. `safeAdd` / `safeSub` / `safeMul` / `safeDiv` all return `(ebool success, T result)` — same pattern, easy to memorize.

### The `_resolveUndefinedHandle` pattern is clever
The Nox library auto-resolves `bytes32(0)` into a typed zero handle for the matching type. That means programmers don't have to write `Nox.toEuint256(0)` every time they need a zero — an uninitialized `euint256` already behaves as zero in arithmetic. Subtle but powerful.

### The confidential token wizard at `cdefi-wizard.iex.ec`
A visual generator for ERC-7984 tokens with toggles (mintable, burnable, pausable, access control) — great for fast bootstrapping. I ended up writing my own DiamCToken in the end, but the wizard is a good on-ramp for newcomers.

## Pain Points

### Encrypted types are limited (only 16 / 256)
The library only ships `euint16`, `euint256`, `eint16`, `eint256`. There's no `euint32`, `euint64`, `euint128`. As a result, for things like timestamps or bps that are typically `uint64`, you have to use `euint256` (overkill) or scale them manually. We need a middle range.

### Doc pages "Coming Soon" / 404
Several important pages weren't written as of April 2026:
- `/getting-started/use-cases` — 404 / "Coming Soon"
- `/guides/build-confidential-smart-contracts` — 404
- `/guides/build-confidential-token` — 404
- `/guides/manage-handle-access` — 404

Hello World is enough to get started, but for more advanced patterns (e.g. handle ACL across contracts, gas optimization), you have to read the `Nox.sol` source directly. Luckily, `Nox.sol` is well commented.

### pnpm + Foundry compatibility friction
The default pnpm `node-linker=isolated` produces a deep `node_modules/.pnpm/...` tree, but Foundry remappings need a flat `node_modules/@xxx/`. The fix: add `node-linker=hoisted` to `.npmrc`. Worth documenting because something like 80% of teams use the pnpm + Foundry combo.

### `Nox.transfer` low-level vs ERC-7984 high-level confusion
At first I assumed `Nox.transfer(from, to, amount)` was an ERC-20-style transfer. It turns out it's a **low-level balance update primitive** for implementing ERC-7984 internals. The ERC-7984 cToken `confidentialTransferFrom` is the high-level wrapper. Confusing for newcomers — the docs should clarify "this primitive is for cToken implementers, not consumers".

### NoxCompute proxy hardcoded per-chain makes local testing hard
`Nox.noxComputeContract()` is hardcoded by chain ID. Foundry's default chain is `31337`, but NoxCompute is deployed at a specific address on a specific chain. Local Foundry tests (`forge test`) crash in `setUp` if the constructor calls `Nox.toEuint256(0)`. Workaround: skip Nox-using tests off-fork, or deploy a mock NoxCompute for Anvil. There should be tooling to auto-deploy a mock NoxCompute on `forge init`.

### No batched `encryptInput`
The JS SDK's `encryptInput(value, type, contract)` is a single-value operation. For OTC (encrypt sellAmount + minBuyAmount + bidAmount, etc.) that's N round-trips to the Handle Gateway. For an RFQ with 10 bidders each placing 1 bid, that's 10 round-trips. We need an `encryptBatch([{value, type}, ...], contract)` API.

### Lint warnings on acronym method names
Forge lint (`forge-lint#mixed-case-function`) flags `createRFQ` / `finalizeRFQ` and wants `createRfq` / `finalizeRfq`. For standard industry acronyms (RFQ = Request For Quote, common OTC terminology), `createRFQ` is more readable. The linter needs an allowlist for known acronyms.

### Address handles are plain only (no `eaddress`)
For a Vickrey auction, you want "the highest bidder's address". But the Nox library doesn't have `eaddress` (encrypted address) yet. Workaround: track the winner index in plaintext, then match against the event off-chain. But that means identity leaks — not optimal for a fully sealed-bid auction.

### Async SDK methods without error context
`encryptInput` throws if the Handle Gateway is down or the key is invalid, but the error message is generic. Hard to debug "is it my contract address that's wrong, my chain, or is the gateway down?". Needs structured errors with code/category.

### Operator authorization isn't self-explanatory at the UX layer
ERC-7984 `setOperator(spender, expiry)` is a **per-holder, per-token** authorization — the settlement contract has to be operator on the token of **every party whose tokens get debited**. For a bilateral trade (sellToken from maker + buyToken from taker), that's 2 wallets × 2 tokens = up to 4 different `setOperator` calls. Without UI that surfaces this upfront, users hit `"DiamCToken: not operator"` reverts on their second transaction, after they've already paid gas. Worth documenting as a pattern in the Confidential Token guide: "before integrating, surface authorize state for both parties involved in any `transferFrom`."

### Local Solidity tooling: Stack-too-deep on Base64 SVG metadata
Building an ERC-721 with onchain SVG `tokenURI` hits "Stack too deep" quickly — `abi.encodePacked` consumes one stack slot per arg, and a single function that builds an SVG with 13+ fragments goes over the limit. `via_ir = true` in `foundry.toml` fixes it but compiles ~10× slower. Manual workaround: split the builder into helper functions that each return `bytes`. Worth documenting for anyone building onchain metadata in a confidential context (NFT receipts, audit-trail tokens, etc.) — it'll be a common pattern.

### Race condition: setState vs synchronous MetaMask popup
wagmi's `useWriteContract().writeContractAsync(...)` calls `window.ethereum` synchronously in the same tick. The naive pattern `setState(image_ready); await mint.submit(...)` looks sequential, but React batches its commit at the end of the microtask — meanwhile `writeContract` fires first, so the MetaMask popup appears **before** the image renders. Not a Nox/wagmi bug per se, but worth a cookbook entry: "trigger wallet ops via `useEffect` after state commits". Common in apps that combine off-chain artifact generation (ChainGPT image, IPFS upload) with onchain commits.

## Suggestions

### High-impact for the hackathon experience
1. **Add `euint64` at minimum** — 80% of encrypted state in typical DeFi needs 64-bit range (timestamps, bps, amounts with decimals). Skipping `euint32` is fine.
2. **Docs for "common patterns"**: payroll, OTC, vesting, auction, vault. The combinations of primitives that get used a lot. It took me roughly 4 hours to reverse-engineer these from `Nox.sol` source.
3. **`Nox.maxOf(euint256[])` helper**: for argmax operations (Vickrey-like, anti-MEV vault). I implemented it manually with loop + select — N transactions with linear gas.
4. **An encrypted `eaddress` type**: for fully-private auction winners + private payment recipients.
5. **Local test mock**: provide a `forge install iExec-Nox/nox-test-mock` with a mock NoxCompute deploy hook so local tests can run encrypted ops.

### Documentation
6. List `node-linker=hoisted` in the docs for pnpm + Foundry users.
7. Clarify "Nox.transfer is an implementor primitive, not a consumer API" in the Solidity Library docs.
8. Add a cookbook section with a minimal ERC-7984 implementation (~150 LOC) — the community needs a reference.

### JS SDK
9. `encryptBatch([{value, type}, ...], contract)` to reduce round-trip latency.
10. Structured errors with `code: 'GATEWAY_DOWN' | 'INVALID_PROOF' | ...`.
11. A `viewOwnBalance(token, account)` helper that combines `confidentialBalanceOf` + `decrypt` into a single call.

## Comparison vs Alternatives

| Aspect | iExec Nox (TEE) | Zama FHEVM (FHE) | Aztec (zk) |
|---|---|---|---|
| **Primitive cost** | Low (TEE off-chain) | High (FHE on-chain) | Medium (zk proof) |
| **Composability** | High (handle bytes32) | Medium (state requires FHE-aware contracts) | Low (UTXO-style, opt-in) |
| **Key management** | iExec KMS + ECDH | Zama KMS + threshold decryption | User-side proving |
| **Tooling maturity** | New (V0.1.0 April 2026) | Mature (FHEVM live ~1 year) | Mature (Aztec mainnet) |
| **DX (TS SDK)** | 9/10 (branded types, 4 methods) | 7/10 (tfhe-rs ergonomic but heavy) | 7/10 (Noir DSL learning curve) |
| **Solidity primitives** | 9/10 (clean overloads) | 8/10 (FHE math is heavier) | n/a (Noir, not Solidity) |

For our OTC use case, Nox wins because: (a) it's composable with ERC-20/7984, (b) gas is reasonable for a Vickrey loop with 10 bidders, and (c) it uses standard Solidity tooling.

## ChainGPT Integration Notes

- The API key flow goes through Telegram (`@vladnazarxyz`) for the hackathon — needs friction-less UI for production.
- `https://api.chaingpt.org/chat/stream` accepts Bearer auth and returns SSE.
- The Smart Contract Auditor wraps cleanly via the `@chaingpt/smartcontractauditor` NPM package. We used direct fetch for edge-runtime compatibility on Vercel. We ended up **dropping** the auditor from the frontend because invocation rate during user testing was effectively zero — the output didn't drive any product decisions. We kept advisor / signal / NFT receipt image features that surface in-flow.
- The NFT generator (`https://api.chaingpt.org/nft-generator`, model `velogen`) is a great fit for receipt artwork — output is 512×512 with a clear visual signature of the trade, no post-processing needed.

## What we'd build next

Diam is a seed. Roadmap:
- Multi-chain deployment (Optimism, Base) once Nox expands.
- Real-time MEV-resistant order matching (off-chain solver, on-chain settlement).
- A Compound Engineering agent marketplace (deploy your own bot, share strategy templates encrypted).
- ERC-3643 compliance integration once the standard matures.

---

Thanks to the iExec team for Nox + tooling + the hackathon. Excited to see the protocol mature 🔒
