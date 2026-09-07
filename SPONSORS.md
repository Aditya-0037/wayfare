# Sponsor tracks

Working reference for the three sponsor integrations. Not a submission document — that
comes later, per M9.

## Hedera — AI & Agentic Payments

- **What's built:** real x402 payments on Hedera testnet via the Blocky402 hosted
  facilitator (`https://api.testnet.blocky402.com`), for all three providers (swift, deep,
  niche). Per-call metering on `deep` (bucketed by input size). HCS topic `0.0.10403773`
  anchors a receipt for every settled call.
- **Proof:** HashScan links in `README.md`'s Status section; Mirror Node topic:
  `https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages`
- **Status:** done (M1, M4, M6, M8).

## ENS — Best Use of ENSv2

- **What's built:** `wayfare.eth` + three provider subnames registered on real ENSv2
  (beta) on Sepolia (not the older v1 registry). ENSIP-26 records (`agent-context`,
  `agent-endpoint[web]`). `wayfare.reputation` gated by Enhanced Access Control — a
  separate settlement-recorder key holds the only grant to write it, proven by live writes
  succeeding/failing from the right/wrong key. The agent discovers all three providers by
  reading `NameRegistered` event logs off-chain, not from a hardcoded list.
- **Proof:** transaction links and the EAC read/write proof in
  `packages/identity/README.md`.
- **Status:** done (M2, M3).

## Bazantic — Agentify a new API / Best Recipe

- **What's built so far:** OpenAPI specs for swift/deep/niche in
  `packages/discovery/openapi/`, written from the real running code.
- **Account:** signed up (Aditya Upadhyay, Personal workspace). Real API key generated
  (dashboard "API Keys" tab, named `wayfare`, expires 2026-09-21). Balance is $0 — no funds
  added yet, pending a decision on whether/how much to add (Bazantic balances are real
  USDC on Base or Tempo, not a testnet credit — no sandbox mode found in their docs).
- **What's blocking:** creating a Gateway via their raw API (`POST /v1/gateways`) rejects
  the dashboard-issued API key in every auth header format tried (`Authorization: Bearer`,
  raw `Authorization`, `x-api-key`) even though `GET` reads accept `x-api-key` fine. Likely
  their write path expects auth via the `baz` CLI's own device-authorization flow rather
  than a raw header — untested. Next step: register the first gateway (swift) through the
  dashboard UI directly instead of the API, using the OpenAPI spec above.
- **What it unlocks once live:** `auth.type: "x402-mpp"` on their Gateway schema means
  Bazantic natively understands our payment model — no separate API-key scheme needed for
  our providers. Recipes bind an LLM (Claude/GPT/Llama/DeepSeek) + gateway tool calls;
  `/v1/recipes/{handle}/test-runs` allows testing a draft Recipe before publishing.
- **Status:** not started (M5) — account exists, gateways not yet registered.
