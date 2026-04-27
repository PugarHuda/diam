# Feedback on iExec Nox Protocol

> Feedback dari builder PrivateOTC selama iExec Vibe Coding Challenge (April-Mei 2026)

## Konteks Builder

- **Project:** PrivateOTC — confidential OTC desk dengan Vickrey RFQ pricing
- **Stack:** Solidity 0.8.27 + Foundry, Next.js 16 + Viem, `@iexec-nox/handle` SDK
- **Network:** Arbitrum Sepolia
- **Tools:** Claude Code (vibe coding), ChainGPT API

---

## What Worked Well

> [TODO: isi setelah build — yang positif dari Nox]

Kandidat:
- Hello World tutorial yang jelas dan progressive
- ERC-7984 standard yang tersedia siap pakai
- Confidential Token wizard di cdefi-wizard.iex.ec untuk bootstrap cepat
- Faucet di cdefi.iex.ec memudahkan testing
- JS SDK API yang ringkas (encryptInput, decrypt, publicDecrypt)

## Pain Points

> [TODO: isi setelah build — friction yang dialami]

Hipotesis awal yang akan diverifikasi:
- Beberapa doc page masih "Coming Soon" / 404 (Use Cases, Build Confidential Token guide)
- Tipe encrypted terbatas: tidak ada `euint32`, `euint64`, `euint128` (cuma 16/256)
- Tidak ada native loop pada encrypted operations — semua harus via `select`
- `div` by zero return MAX (no revert) — perlu hati-hati di smart contract logic
- Belum ada batched encrypt input — kalau perlu encrypt 5 values, 5 round-trip
- Gas profile loop with `Nox.select` di Vickrey logic — perlu cap max bidder

## Suggestions

> [TODO: isi setelah build]

Hipotesis suggestions:
- Tambah doc untuk "common patterns": auctions, OTC, vesting, payroll
- Tambah `euint64` untuk timestamp/durations yang umum di smart contract
- Tambah helper `Nox.maxOf(euint256[] memory)` untuk argmax operations (Vickrey-like)
- Tambah batched `encryptInputs([...])` untuk reduce SDK round-trips
- Eksposisi cost analysis: gas comparison vs FHE (Zama) untuk equivalent ops
- ABI helper di JS SDK untuk auto-encode `externalEuint256 + bytes proof` jadi 1 call

## ChainGPT Integration Notes

> [TODO: isi setelah build]

## Comparison vs Alternatives

> [TODO: isi setelah build — versus Zama FHEVM, Inco, Aztec, dll]

---

*Updated: [DATE]*
