# Contracts Package — PrivateOTC

## Stack

- **Language:** Solidity `^0.8.27`
- **Build:** Foundry (`forge`)
- **Library:** `@iexec-nox/nox-protocol-contracts` for confidential ops, OpenZeppelin for utils

## Structure

```
src/
├── PrivateOTC.sol              # Main orchestrator (Direct OTC + RFQ Vickrey)
├── interfaces/
│   ├── IPrivateOTC.sol         # External interface
│   ├── IERC7984.sol            # Confidential fungible token interface
│   └── IERC7984Receiver.sol    # ERC-7984 receiver callback (transferAndCall)
└── tokens/
    └── DiamCToken.sol          # ERC-7984 confidential token (cUSDC, cETH)

test/                            # Foundry tests (local + fork)
script/                          # Deploy & operational scripts
```

## Key patterns

### Encrypted state initialization

Tipe `euint256` HARUS di-initialize via `Nox.toEuint256(0)`, beda dari `uint256` yang default ke 0.

```solidity
constructor() {
    sellAmount = Nox.toEuint256(0);
    Nox.allowThis(sellAmount);
}
```

### After every encrypted op, grant permissions

Setiap kali bikin handle baru (add/sub/mul/select/dst), HARUS grant access:

```solidity
balance = Nox.add(balance, amount);
Nox.allowThis(balance);          // contract bisa pakai lagi
Nox.allow(balance, owner);        // owner bisa decrypt off-chain
```

### Branching on encrypted

Tidak bisa pakai `if` pada `ebool`. Pakai `Nox.select(cond, ifTrue, ifFalse)`.

### Vickrey loop pattern

```solidity
for (uint i = 1; i < bids.length; i++) {
    ebool isHigher = Nox.gt(candidate, highest);
    second = Nox.select(isHigher, highest, second);
    highest = Nox.select(isHigher, candidate, highest);
}
```

Cap max iter ~10 untuk gas reasonable.

### Safe arithmetic

`add/sub/mul/div` itu wrapping. Untuk overflow detection tanpa leak via revert, pakai `safeAdd` etc — return `(ebool success, result)`.

## How to run

```bash
forge install                       # install lib deps (forge-std, OpenZeppelin)
forge build                          # compile
forge test -vvv                      # run tests verbose
forge test --gas-report              # gas profile
forge script script/Deploy.s.sol \   # deploy
  --rpc-url $ARBITRUM_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast --verify
```

## Gotchas

- Loop iterasi `Nox.select` mahal — cap RFQ bidder 10 max
- `div` by zero return MAX (no revert) — selalu check denominator
- Tipe terbatas: `euint16`/`euint256` saja (no `euint64`)
- `externalEuint256` + bytes proof harus pas — kalau proof invalid, revert
