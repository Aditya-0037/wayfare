# Sponsor tracks — ETHOnline 2026, Start Fresh track

Working reference for the three sponsor integrations. Not a submission document — that
comes later, per M9.

## Hedera — AI & Agentic Payments on Hedera ($6,000, up to 3 teams @ $2,000)

**Qualification (confirmed from the real prize page):**
- Host a live x402-gated service on Hedera testnet/mainnet, settled through Blocky402. ✅
- Build a platform/agent that consumes it, completes ≥1 real paid request end to end. ✅
- Public repo, README covering setup/architecture/payment flow. ✅ (could still be tightened)
- Demo video ≤5 min showing the paid request executing. — needed at M9, not yet.

**Extra points and where we stand:**
- Metered pricing, not flat — ✅ `deep` (bucketed by input size).
- Verifiable payment audit trail on HCS — ✅ every settled call, `packages/receipts`.
- Agent discovery via a directory — ✅ ENS-based, arguably stronger than the "UCP" example given.
- Multi-agent negotiation (A2A/ACP) — not done.
- On-chain agent identity via ERC-8004 or HCS-14 — not done; worth a look if there's time.
- HTS tokens / custom fee schedules — not done, plain HBAR only.
- Recurring/streamed payments via Scheduled Transactions — not done.

**Proof:** HashScan links in `README.md` Status section; Mirror Node topic
`https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages`.

There's also a separate, unrelated Hedera track ("Open Source — Improve the Hedera
Harness," $2,000, contributing to github.com/hedera-dev/hedera-harness) — not something
this project naturally produces, noting it exists in case it's worth a separate side entry.

## ENS — Best Use of ENSv2 ($4,500: $1,500 / $1,500 / $1,000 / $500 runner-up)

**Qualification (confirmed):**
- Built on ENSv2 (Sepolia), features central not cosmetic. ✅
- Demo functional, not hardcoded values. ✅ (discovery is genuinely event-log driven)
- Video or live demo + open source. — needed at M9.

**Bonus called out explicitly:** "agents as namespaces, each with their own identity and
permissions" — matches what we built (each provider = its own dedicated resolver + EAC
scope) almost exactly.

**Proof:** transaction links and the live EAC read/write proof in
`packages/identity/README.md`.

Possible strengthening: ENSIP-25 ("AI Agent Registry ENS Name Verification") is mentioned
alongside ENSIP-26 in the sponsor's own resource list — worth a look if there's spare time,
not required.

## Bazantic — three Start-Fresh-eligible prizes, $3,000 total

Real dashboard account exists (Aditya Upadhyay, Personal workspace), API key named
`wayfare` generated (expires 2026-09-21). Balance $0 — no funds added; real USDC on
Base/Tempo, no confirmed sandbox mode.

**Confirmed exact requirements (from the real ETHGlobal prize page, not the marketing site):**

1. **"Help an Agent Use Your Hackathon Project"** ($1,000) — **Continuity Track only. We
   don't qualify** (we're Start Fresh).

2. **"Best Recipe Using ETHGlobal Hackathon Sponsor APIs"** ($1,000: $500/$300/$200) —
   eligible. Needs: deploy a Gateway, integrate ≥1 *additional* service (from Bazantic or
   another sponsor), build a Recipe combining both, results must meaningfully depend on
   both, screen recording, Bazantic username.

3. **"Agentify a New API"** ($1,000: $500/$300/$200) — eligible. Needs: deploy a Gateway
   for a previously-unavailable API (swift/deep/niche qualify — genuinely new), build a
   Recipe combining the new + an existing service, demonstrate the Recipe is *reusable*
   (not a one-off), screen recording explaining the builder/agent utility.

**One Recipe can likely satisfy both #2 and #3** if it combines one of our new gateways
with an already-listed Bazantic gateway (e.g. PurpleAir or Api Ninjas, both seen live on
the platform already).

**What's blocking right now:** creating a Gateway via the raw API (`POST /v1/gateways`)
rejects our API key in every header format tried (`Authorization: Bearer`, raw
`Authorization`, `x-api-key`), even though `GET` reads accept `x-api-key` fine. Registering
through the dashboard UI directly (Gateways tab) is the fallback — in progress.

**What it unlocks once live:** `auth.type: "x402-mpp"` on their Gateway schema means
Bazantic natively understands our payment model. `/v1/recipes/{handle}/test-runs` allows
testing a draft Recipe before publishing.

**Status:** account + API key exist; gateway not yet registered (M5 not started).
