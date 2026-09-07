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
- [x] M3 — discovery replaces config. The agent finds providers by reading `NameRegistered`
      event logs off wayfare.eth's ENS subregistry — no provider name or URL anywhere in
      `apps/agent/src` (`grep -r "provider.*http" apps/agent/src` returns nothing).
- [x] M4 — choice. All three providers live, independently paid for real. Two runs with
      different budgets pick different providers, with the reasoning logged — see below.
- [x] M6 — receipts. Every settled call anchors to one HCS topic (provider ENS name,
      quote id, amount, tx id, result hash, timestamp), independently checkable on
      Mirror Node: https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages
- [ ] M5, M7 — M9: not started

## Layout

```
apps/
  agent/               discovers providers over ENS, assesses quotes, decides, pays
  providers/
    swift/              built — fast/cheap text summarizer, x402-gated
    deep/                built — thorough, metered by input size (bucketed pricing)
    niche/               built — only handles markdown lists, fails loudly (422) otherwise
  web/                   not yet built (M7)
packages/
  identity/              built — ENS resolution + setup, real ENSv2 beta on Sepolia
  discovery/             not yet built (M5) — Bazantic MCP + Recipes
  receipts/              built — one HCS topic, anchors every settled call
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

## Running it locally

You need a funded Hedera **testnet** account with an **ECDSA** key (the `@x402/hedera`
exact scheme currently assumes ECDSA). Get one free from the
[Hedera Portal](https://portal.hedera.com/) — it auto-funds new testnet accounts with
1000 test HBAR. Each provider needs its own merchant account too — `apps/agent/scripts/
create-merchant-account.ts` mints one from your funded account, no second portal signup.

1. `npm install` at the repo root (installs all workspaces).
2. Set up `wayfare.eth` and its provider subnames once — see `packages/identity/README.md`.
   (Already done for this repo's own `wayfare.eth`; a fresh fork needs its own registration.)
3. Copy each `apps/providers/*/.env.example` → `.env`, set `HEDERA_MERCHANT_ACCOUNT_ID`.
4. Copy `apps/agent/.env.example` → `.env`, set `HEDERA_PAYER_ACCOUNT_ID` /
   `HEDERA_PAYER_PRIVATE_KEY` (ECDSA, `0x`-prefixed).
5. Three terminals: `npm run dev:swift`, `npm run dev:deep`, `npm run dev:niche`.
6. From `apps/agent`: `npx tsx src/index.ts "<some text to summarize>"`

The agent discovers all three from ENS, asks each for a quote, drops any that can't handle
the input (niche 422s on non-list text before any payment), picks the highest-quality one
it can afford, and pays it. Run it again with a small budget —
`MAX_TOTAL_TINYBARS=150000 MAX_PRICE_PER_CALL_TINYBARS=150000 npx tsx src/index.ts "..."`
— and it picks swift instead, logging exactly why. Every run prints a HashScan link and a
Mirror Node link for the HCS receipt it anchored.
