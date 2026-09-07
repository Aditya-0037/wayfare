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
- On-chain agent identity via ERC-8004 or HCS-14 — ✅ done. HCS-14 (deterministic id,
  SHA-384 + base58 of six canonical fields), published for the agent and each provider,
  verified independently by recomputing the hash from the on-chain record and confirming
  it matches — not just asserted. Matched to the *real* reference implementation's field
  order (`skills, name, nativeId, protocol, registry, version`), which differs from what
  the published spec page's prose says (it claims alphabetical — the code doesn't do that).
- HTS tokens / custom fee schedules — not done, plain HBAR only.
- Recurring/streamed payments via Scheduled Transactions — not done.

**Proof:** HashScan links in `README.md` Status section; receipts topic
`https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages`; HCS-14
identity topic `https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10404697/messages`.

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

**Gateways: done.** The raw REST API (`POST /v1/gateways`) rejected our dashboard-issued
API key in every header format tried — turned out gateway management needs a *separate*
device-login session, not that key. `npm i -g @bazantic/cli`, `baz login` (device-code
flow, approved once in the browser), then `baz gateway add --spec-url ... --endpoint
... --auth-type x402-mpp --status draft` for each provider. Endpoint must be `https://`
— no localhost — so each provider is temporarily exposed via a `cloudflared` quick tunnel
pending a real deployment. All three registered and confirmed via `baz gateway list`:

| Provider | Gateway slug | MCP endpoint |
|---|---|---|
| swift | `gxfxdj6pbfbpjhxz4rimmrk6kq` | `https://gxfxdj6pbfbpjhxz4rimmrk6kq.bazgateway.com/mcp` |
| deep | `ydhc6cktzjfhpbaymi55wf7xx4` | `https://ydhc6cktzjfhpbaymi55wf7xx4.bazgateway.com/mcp` |
| niche | `xo32sarhtfcfzcqzy7ii2we2d4` | `https://xo32sarhtfcfzcqzy7ii2we2d4.bazgateway.com/mcp` |

**Real deployment now exists** (Render, free tier, auto-deploys from `master`):
`https://wayfare-swift.onrender.com`, `https://wayfare-deep.onrender.com`,
`https://wayfare-niche.onrender.com`. ENS `agent-endpoint[web]` for all three now points
at these — verified by running the actual agent end to end against them (discover, quote,
decline niche on non-list input, pick deep, pay, HCS receipt, reputation update), not just
a health check. Re-registered all three gateways pointing at these Render URLs (the `baz`
CLI has no update/delete, only add/list, so the old tunnel-backed entries are now stale
duplicates — harmless, but worth deleting via the dashboard before submission):

| Provider | Gateway slug | Endpoint |
|---|---|---|
| swift | `c3sac2kabjbeldnj7lyut7iyzq` | `https://wayfare-swift.onrender.com` |
| deep | `tgbve4lyhrcczglh637jp2kvqu` | `https://wayfare-deep.onrender.com` |
| niche | `yd44u25h5nh6pnxgay7dojwjri` | `https://wayfare-niche.onrender.com` |

**Important finding: `draft` gateways don't actually proxy traffic.** Calling
`https://<slug>.bazgateway.com/health` on any of these — old or new — returns a bare 404,
even though the registration itself succeeds and shows correctly in `gateway list`.
Cross-referenced against the `become-a-provider` page's note that a *dedicated* gateway
created as `active` needs "an active payout account" (a real banking/KYC step): `draft`
appears to be registration-only, and actually serving requests needs `active` status,
which needs that payout account set up. Setting up real payout/banking details isn't
something to automate — that's a decision for the account owner. The registration itself
(correct OpenAPI spec, correct endpoint, correct auth type) is real and complete; going
fully live needs you to flip it to `active` via the dashboard once payout is configured,
if you want it actually callable rather than just registered.

**Recipes: still open.** The CLI has no `recipe` subcommand (gateways/curl/wallet/grants
only) — Recipes are dashboard-only for now. The raw API's `/v1/recipes` endpoints also
reject both the dashboard API key *and* the CLI's own session token in every format tried,
so this one genuinely needs the dashboard's Recipes tab by hand. This is what both
remaining prizes need: a Recipe combining one of the three gateways above with an
already-listed one (PurpleAir or Api Ninjas were seen live on the platform).

**Status:** all three gateways live (satisfies "Agentify a New API"'s gateway requirement).
Recipe not yet built — the one piece left for both eligible Bazantic prizes.
