# Feedback on iExec Nox Protocol

> Pengalaman builder Diam selama iExec Vibe Coding Challenge (April–Mei 2026).
> Ditulis setelah ship: 5 git commits, 4 packages monorepo, 3 contracts deployed di Arbitrum Sepolia.

## Konteks Builder

- **Project:** Diam — confidential OTC desk dengan Vickrey RFQ + Compound Engineering agents + MCP server
- **Stack:** Solidity 0.8.27 + Foundry, Next.js 16 + Viem, `@iexec-nox/handle@0.1.0-beta.10`, `@iexec-nox/nox-protocol-contracts@0.2.2`
- **Network:** Arbitrum Sepolia
- **Tools utama:** Claude Code (vibe coding), ChainGPT API
- **Total LOC:** ~3,800 lines across 4 packages

## What Worked Well

### Hello World tutorial yang excellent
Tutorial Piggy Bank di `docs.iex.ec/nox-protocol/getting-started/hello-world` adalah cara terbaik on-ramp ke Nox. Progressive: tulis kontrak biasa dulu, baru convert ke confidential. Setiap perubahan dijelaskan dengan rationale. Itu yang bikin saya cepat ngerti pattern `Nox.fromExternal` + `Nox.allowThis` + `Nox.allow`.

### `Nox.transfer/mint/burn` primitives elegant
Operasi `Nox.transfer(senderBalance, receiverBalance, amount) → (success, newSender, newReceiver)` sangat clean. Atomic, returns updated balances + success ebool. Saya pakai langsung di MockCToken untuk implement ERC-7984 dalam ~150 baris. Itu jauh lebih ringkas daripada implementasi FHE-based.

### TypeScript SDK branded types
`Handle<T>` di `@iexec-nox/handle` di-define sebagai `HexString & { __solidityType?: T }` — branded type yang preserve type info dari off-chain encrypt sampai contract write. TypeScript catches errors di compile time meskipun runtime cuma 32-byte hex. DX-nya sangat baik.

### Solidity Library API yang konsisten
Setiap operasi (`add`, `sub`, `eq`, `gt`, `select`) ada overload untuk semua tipe (`euint16`, `euint256`, `eint16`, `eint256`). Konsisten dan predictable. `safeAdd/safeSub/safeMul/safeDiv` semua return `(ebool success, T result)` — pattern yang sama, mudah dihafal.

### `_resolveUndefinedHandle` pattern clever
Library Nox auto-resolve `bytes32(0)` jadi typed zero handle untuk type yang sesuai. Itu artinya programmer gak perlu `Nox.toEuint256(0)` setiap kali butuh zero — uninitialized euint256 already behaves as zero in arithmetic. Subtle tapi powerful.

### Confidential token wizard di `cdefi-wizard.iex.ec`
Generator visual untuk ERC-7984 token dengan toggle (mintable, burnable, pausable, access control) — bagus untuk bootstrap cepat. Saya akhirnya tulis MockCToken sendiri, tapi wizard adalah on-ramp yang baik untuk newcomer.

## Pain Points

### Tipe encrypted terbatas (cuma 16/256)
Library cuma punya `euint16`, `euint256`, `eint16`, `eint256`. Tidak ada `euint32`, `euint64`, `euint128`. Konsekuensinya: untuk timestamp atau bps yang umumnya `uint64`, harus pakai `euint256` (overkill) atau scale manual. Perlu range tengah.

### Doc pages "Coming Soon" / 404
Beberapa halaman penting belum ditulis per April 2026:
- `/getting-started/use-cases` — 404 / "Coming Soon"
- `/guides/build-confidential-smart-contracts` — 404
- `/guides/build-confidential-token` — 404
- `/guides/manage-handle-access` — 404

Hello World cukup untuk start, tapi untuk pattern advanced (e.g. handle ACL across contracts, gas optimization), harus baca source code Nox.sol langsung. Untungnya kode Nox.sol well-commented.

### pnpm + Foundry compatibility friction
Default pnpm `node-linker=isolated` bikin `node_modules/.pnpm/...` deep tree, tapi Foundry remappings butuh flat `node_modules/@xxx/`. Solusinya: tambah `.npmrc` dengan `node-linker=hoisted`. Worth dokumenkan karena 80% of teams pakai pnpm + Foundry combo.

### `Nox.transfer` low-level vs ERC-7984 high-level confusion
Awalnya saya pikir `Nox.transfer(from, to, amount)` adalah ERC-20-style transfer. Ternyata itu **low-level balance update primitive** untuk implementing ERC-7984 internals. ERC-7984 cToken `confidentialTransferFrom` adalah high-level wrapper. Confusing untuk newcomer — perlu doc clarifies "this primitive is for cToken implementers, not consumers".

### NoxCompute proxy hardcoded per-chain bikin local testing susah
`Nox.noxComputeContract()` hardcoded pakai chain ID. Foundry default chain `31337` tapi NoxCompute deployment di address spesifik di chain ID itu. Local Foundry test (`forge test`) crash di setUp jika constructor pakai `Nox.toEuint256(0)`. Workaround: skip Nox-using tests on non-fork, atau deploy mock NoxCompute untuk Anvil. Perlu tooling untuk auto-deploy mock NoxCompute on forge init.

### No batched encryptInput
JS SDK `encryptInput(value, type, contract)` adalah single-value operation. Untuk OTC (encrypt sellAmount + minBuyAmount + bidAmount, dst), itu N round-trips ke Handle Gateway. Untuk RFQ dengan 10 bidder masing-masing 1 bid, itu 10 roundtrips. Perlu `encryptBatch([{value, type}, ...], contract)` API.

### Lint warning untuk acronym method names
Forge lint (`forge-lint#mixed-case-function`) flag `createRFQ` / `finalizeRFQ` — mau ubah jadi `createRfq` / `finalizeRfq`. Untuk acronym standard (RFQ = Request For Quote, terminologi industri OTC), `createRFQ` lebih clear. Lint perlu allowlist untuk known acronyms.

### Address handle cuma plain (no eaddress)
Untuk Vickrey auction, kita butuh "the highest bidder's address". Tapi Nox library tidak punya `eaddress` (encrypted address) yet. Workaround: track winner index plain, lalu match dengan event off-chain. Tapi itu artinya identity bocor — gak optimal untuk full sealed-bid.

### SDK methods async tanpa kontekst error
`encryptInput` throws kalau Handle Gateway down atau key invalid, tapi error message generic. Susah debug "is it my contract address wrong, my chain wrong, or gateway down?". Perlu structured errors dengan code/category.

### Operator authorization tidak self-explanatory di UX layer
ERC-7984 `setOperator(spender, expiry)` adalah **per-holder, per-token** authorization — settlement contract harus jadi operator di token-nya **setiap pihak yang token-nya didebit**. Untuk bilateral trade (sellToken dari maker + buyToken dari taker) artinya 2 wallet × 2 token = bisa 4 setOperator yang berbeda. Tanpa UI yang kasih tau ini upfront, user hit revert "DiamCToken: not operator" di tx kedua mereka, after gas terbayar. Worth nge-doc pattern di Confidential Token guide: "before integrating, surface authorize state for both parties involved in any transferFrom".

### Local Solidity tooling: Stack-too-deep on Base64 SVG metadata
Ngebuild ERC-721 dengan onchain SVG tokenURI hit "Stack too deep" cepat — `abi.encodePacked` consume satu stack slot per arg, dan satu function yang bikin SVG 13+ fragment langsung over limit. `via_ir = true` di foundry.toml fix tapi compile ~10x lebih lambat. Workaround manual: split builder ke beberapa helper function yang return `bytes`. Worth dokumented untuk anyone yang mau bikin onchain metadata di confidential context (NFT receipts, audit trail tokens, etc) — pattern yang akan jadi common.

### Race condition: setState vs sync MetaMask popup
`useWriteContract().writeContractAsync(...)` dari wagmi panggil `window.ethereum` sync di tick yang sama. Pattern naive `setState(image_ready); await mint.submit(...)` keliatannya sequential, tapi React batch commit di akhir microtask — sementara writeContract jalan dulu, popup MetaMask muncul **sebelum** image render. Bukan bug Nox/wagmi specifically, tapi worth ada cookbook pattern "trigger wallet ops via useEffect after state commits" — common di apps yang gabungin off-chain artifact generation (ChainGPT image, IPFS upload) + onchain commit.

## Suggestions

### High-impact untuk hackathon experience
1. **Tambah `euint64` minimum** — 80% dari encrypted state di DeFi typical butuh range 64-bit (timestamps, bps, amounts dengan decimals). Skip `euint32` ok.
2. **Doc untuk "common patterns"**: payroll, OTC, vesting, auction, vault. Kombinasi primitif yang sering dipakai. Saya butuh kira-kira 4 jam reverse-engineer ini dari Nox.sol source.
3. **`Nox.maxOf(euint256[])` helper**: untuk argmax operations (Vickrey-like, anti-MEV vault). Saya implement secara manual dengan loop + select; itu N transactions dengan gas linear.
4. **Encrypted `eaddress` type**: untuk fully-private auction winners + private payment recipients.
5. **Local test mock**: provide a `forge install iExec-Nox/nox-test-mock` dengan mock NoxCompute deploy hook supaya local tests bisa run encrypted ops.

### Documentation
6. Cantumkan `node-linker=hoisted` di doc untuk pnpm + Foundry users.
7. Clarify "Nox.transfer is implementor primitive, not consumer API" di Solidity Library doc.
8. Tambah cookbook section dengan minimal ERC-7984 implementation (~150 LOC) — komunitas perlu reference.

### JS SDK
9. `encryptBatch([{value, type}, ...], contract)` untuk reduce roundtrip latency.
10. Structured errors dengan `code: 'GATEWAY_DOWN' | 'INVALID_PROOF' | ...`.
11. Helper `viewOwnBalance(token, account)` yang combine `confidentialBalanceOf` + `decrypt` jadi 1 call.

## Comparison vs Alternatives

| Aspect | iExec Nox (TEE) | Zama FHEVM (FHE) | Aztec (zk) |
|---|---|---|---|
| **Primitive cost** | Low (TEE off-chain) | High (FHE on-chain) | Medium (zk proof) |
| **Composability** | High (handle bytes32) | Medium (state requires FHE-aware contracts) | Low (UTXO-style, opt-in) |
| **Key management** | iExec KMS + ECDH | Zama KMS + threshold decryption | User-side proving |
| **Tooling maturity** | New (V0.1.0 April 2026) | Mature (FHEVM live ~1 year) | Mature (Aztec mainnet) |
| **DX (TS SDK)** | 9/10 (branded types, 4 methods) | 7/10 (tfhe-rs ergonomic but heavy) | 7/10 (Noir DSL learning curve) |
| **Solidity primitives** | 9/10 (clean overloads) | 8/10 (FHE math heavier) | n/a (Noir, not Solidity) |

Untuk OTC use case kami, Nox menang karena: (a) composable dengan ERC-20/7984, (b) gas reasonable untuk Vickrey loop dengan 10 bidder, (c) standard Solidity tooling.

## ChainGPT Integration Notes

- API key flow lewat Telegram (@vladnazarxyz) untuk hackathon — perlu UI yang lebih friction-less untuk produksi.
- `https://api.chaingpt.org/chat/stream` accept Bearer auth, return SSE.
- Smart Contract Auditor wrap pretty well lewat NPM package `@chaingpt/smartcontractauditor`. Kita pakai fetch direct biar edge-runtime compatible di Vercel. Akhirnya kita **drop** auditor dari frontend karena invocation rate dari user testing effectively zero — output-nya gak drive product decision. Kept advisor / signal / NFT receipt image yang muncul in-flow.
- NFT generator (`https://api.chaingpt.org/nft-generator`, model `velogen`) cocok banget untuk receipt artwork — output 512×512 yang langsung visual signature trade-nya, gak butuh post-processing.

## Apa yang akan kami bangun selanjutnya

Diam adalah seed. Roadmap:
- Multi-chain deployment (Optimism, Base) setelah Nox expand.
- Real-time MEV-resistant order matching (off-chain solver, on-chain settlement).
- Compound Engineering agent marketplace (deploy your own bot, share strategy templates encrypted).
- ERC-3643 compliance integration setelah ERC standard mature.

---

Terima kasih iExec team untuk Nox + tooling + hackathon. Excited untuk lihat protocol mature 🔒
