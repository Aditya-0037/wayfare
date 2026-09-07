# Wayfare

Every agentic-payments demo hardcodes its endpoints — the agent already knows every
seller, which means there's no actual market. Wayfare's agent starts with a task and a
budget, not a list of tools: it resolves providers at runtime over ENS, picks between
them on price and quality, pays per call on Hedera testnet via x402, and anchors a
receipt to HCS for every provider it ever deals with.

This README tracks what's actually built, not what's planned.

## Status

- [x] M1 — one paid call. Settled for real on Hedera testnet via Blocky402:
      https://hashscan.io/testnet/transaction/0.0.7162784-1788608829-232641440
- [x] M2 — ENS resolution. `wayfare.eth` and `swift.wayfare.eth` are registered on real
      ENSv2 (beta) on Sepolia, resolving live via `packages/identity`. `wayfare.reputation`
      is gated by Enhanced Access Control — see `packages/identity/README.md`.
- [~] M4 — three providers live and independently proven with real payments (swift, deep,
      niche). Choice logic (agent picks between them against budget) is next, alongside M3.
- [ ] M3, M5 — M9: not started

## Layout

```
apps/
  agent/               the agent runtime (M1: single hardcoded paid call)
  providers/
    swift/              built — fast/cheap text summarizer, x402-gated
    deep/                built — thorough, metered by input size (bucketed pricing)
    niche/               built — only handles markdown lists, fails loudly (422) otherwise
  web/                   not yet built (M7)
packages/
  identity/              built — ENS resolution + setup, real ENSv2 beta on Sepolia
  discovery/             not yet built (M5) — Bazantic MCP + Recipes
  receipts/              not yet built (M6) — HCS receipts
```

Task domain for the three providers: text summarization.
- `swift` — first two sentences verbatim. Cheap, shallow, flat fee.
- `deep` — frequency-ranked extractive summary over the whole input. Slower, better, priced
  by a bucketed input-size tier (small/medium/large).
- `niche` — only summarizes markdown-style lists. Rejects anything else at quote time with a
  422, before any payment — it doesn't guess outside its domain.

## Payment stack

- Protocol: [x402](https://x402.gitbook.io/x402/) v2, `exact` scheme, Hedera testnet
- SDK: `@x402/core`, `@x402/hedera`, `@x402/express` (provider), `@x402/fetch` (agent)
- Facilitator: [Blocky402](https://blocky402.com) hosted testnet instance —
  `https://api.testnet.blocky402.com`, open access, no API key. It holds the fee-payer
  key and submits/pays gas for every settlement; providers only ever declare a `payTo`
  account, never a private key.

## ENS layer

- `wayfare.eth` and `swift.wayfare.eth` live on ENSv2 (beta), on Sepolia — a genuinely
  different, newer contract set than the classic ENS v1 registry most tooling targets.
- Records follow [ENSIP-26](https://discuss.ens.domains/t/ensip-26-ens-native-ai-identity/21968):
  `agent-context` (free text describing the provider), `agent-endpoint[web]`, and a custom
  `wayfare.reputation` record that only a separate settlement-recorder key can write —
  enforced by Enhanced Access Control, not just convention. Details and setup scripts in
  `packages/identity/README.md`.

## Running M1 locally

You need a funded Hedera **testnet** account with an **ECDSA** key (the `@x402/hedera`
exact scheme currently assumes ECDSA). Get one free from the
[Hedera Portal](https://portal.hedera.com/) — it auto-funds new testnet accounts with
1000 test HBAR.

1. `npm install` at the repo root (installs all workspaces).
2. Copy `apps/providers/swift/.env.example` → `.env`, set `HEDERA_MERCHANT_ACCOUNT_ID`
   to any Hedera account id that can receive HBAR (this is the seller — it never needs
   a private key).
3. Copy `apps/agent/.env.example` → `.env`, set `HEDERA_PAYER_ACCOUNT_ID` and
   `HEDERA_PAYER_PRIVATE_KEY` (ECDSA, `0x`-prefixed) from the account you just funded.
4. Terminal A: `npm run dev:swift`
5. Terminal B: `npm run dev:agent`

Expected output: a quote, a paid `/v1/execute` call, a summary, and a HashScan link
(`https://hashscan.io/testnet/transaction/<id>`) proving the on-chain settlement.

`M1_PROVIDER_URL` in `apps/agent/.env` is the **only** hardcoded endpoint in this
codebase, and only until M3 — the acceptance test for M3 is
`grep -r "provider.*http" apps/agent/src` returning nothing.
