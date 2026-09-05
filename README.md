# Wayfare

An agent that discovers services it has never seen before, pays for them per call on
Hedera testnet via x402, and leaves a verifiable receipt trail.

Full requirements: see the project spec shared at kickoff (architecture, milestones,
sponsor mapping, risks). This README tracks what's actually built.

## Status

- [x] Repo scaffolded (this commit)
- [ ] **M1 — one paid call.** Code is written (`apps/agent`, `apps/providers/swift`) but
      not yet run end-to-end — needs a funded Hedera testnet account (see below).
- [ ] M2 — M9: not started

## Layout

```
apps/
  agent/               the agent runtime (M1: single hardcoded paid call)
  providers/
    swift/              built — fast/cheap text summarizer, x402-gated
    deep/, niche/        not yet built (M4)
  web/                   not yet built (M7)
packages/
  identity/              not yet built (M2) — ENS resolution
  discovery/             not yet built (M5) — Bazantic MCP + Recipes
  receipts/              not yet built (M6) — HCS receipts
```

Task domain for the three providers: text summarization. `swift` returns the
first two sentences verbatim (cheap, shallow). `deep` and `niche` are not yet built.

## Payment stack

- Protocol: [x402](https://x402.gitbook.io/x402/) v2, `exact` scheme, Hedera testnet
- SDK: `@x402/core`, `@x402/hedera`, `@x402/express` (provider), `@x402/fetch` (agent)
- Facilitator: [Blocky402](https://blocky402.com) hosted testnet instance —
  `https://api.testnet.blocky402.com`, open access, no API key. It holds the fee-payer
  key and submits/pays gas for every settlement; providers only ever declare a `payTo`
  account, never a private key.

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
