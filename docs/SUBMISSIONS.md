# Sponsor submission writeups

Draft text for each track's submission form, ready to copy in. Every link and number below
is real and independently checkable — nothing here is placeholder copy. Swap in the demo
video link once it's recorded (see `DEMO_SCRIPT.md`); everything else is final.

---

## Hedera — AI & Agentic Payments

**One-liner**

Wayfare is an agent that discovers x402-payment-gated services it has never seen before —
entirely at runtime, over ENS — and pays for them per call on Hedera testnet, anchoring a
Hedera Consensus Service receipt to every settlement.

**What it does**

Give the agent a task and a budget. It reads ENS event logs to find out what sellers exist
(no hardcoded provider list anywhere in its source), asks each one for a live quote, drops
anything that can't do the job before paying a cent, picks the best option it can afford,
and pays over x402 (exact scheme) via the Blocky402 hosted facilitator. Every settled call
gets a receipt anchored to HCS — provider, quote id, amount, tx id, a hash of the result,
and a timestamp — checkable by anyone on Mirror Node, independent of this codebase's own
word for it.

**Why it's more than a demo**

- Metered pricing, not flat: `deep` prices by a bucketed input-size tier, not a single fee.
- Full payment audit trail on HCS for every call, not just the happy path.
- Guardrails enforced *before* every payment: max spend, max price per call, max calls, and
  a balance floor checked against the real on-chain account balance — a run that would
  drain the reserve refuses before ever calling the payment path, never after.
- On-chain agent identity via HCS-14: a deterministic id (SHA-384 + base58 of six canonical
  fields) published for the agent and every provider, matched to the *actual* reference
  implementation's field order rather than the published spec page's prose (they disagree —
  documented in `packages/receipts/README.md`).
- Discovery via ENS is arguably a stronger "directory" than a config file: providers can be
  added or re-pointed on-chain without touching the agent's code at all.

**Proof**

- First settled payment: https://hashscan.io/testnet/transaction/0.0.7162784-1788608829-232641440
- Every settlement receipt: https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages
- HCS-14 identity announcements: https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10404697/messages
- Repo: https://github.com/Aditya-0037/wayfare

**Demo video:** _link once recorded — script at `docs/DEMO_SCRIPT.md`_

---

## ENS — Best Use of ENSv2

**One-liner**

Every provider Wayfare's agent can pay is a real ENSv2 (beta) name on Sepolia — its own
dedicated resolver, its own Enhanced Access Control grant, discovered by scanning
`NameRegistered` event logs, never by reading a list a developer wrote down.

**What it does**

`wayfare.eth` and its three provider subnames (`swift`, `deep`, `niche`) are registered on
the newer ENSv2 contract set, not the classic v1 registry most tooling still targets. Each
provider gets its own `DedicatedResolver` — one resolver per name, not the older shared,
multi-tenant kind — carrying ENSIP-26 records (`agent-context`, `agent-endpoint[web]`) plus
a custom `wayfare.reputation` record. That reputation record is gated by Enhanced Access
Control: only one specific settlement-recorder key — not even the deployer's own admin key
— can write it. This is proven on-chain, not asserted: `packages/identity/README.md` shows
an actual attempted write from the wrong key reverting.

**Why ENS is load-bearing, not decorative**

`grep -r "provider.*http" apps/agent/src` returns nothing — there is no provider name or
URL anywhere in the agent's source. Every run resolves `wayfare.eth`'s subregistry for
`NameRegistered` events, then reads each discovered label's `agent-context` and
`agent-endpoint[web]` straight from its dedicated resolver. Add a fourth provider on-chain
and the agent finds it on the next run with zero code changes.

**Matches the sponsor's own bonus criterion almost exactly**

The prize page calls out "agents as namespaces, each with their own identity and
permissions" as a bonus pattern — that's precisely the shape here: one dedicated resolver
and one EAC scope per agent.

**Proof**

- Full transaction history and the live EAC read/write proof: `packages/identity/README.md`
- Repo: https://github.com/Aditya-0037/wayfare

**Demo video:** _link once recorded_

---

## Bazantic — Agentify a New API

**One-liner**

Wayfare's three x402-gated providers (`swift`, `deep`, `niche`) — genuinely new APIs that
didn't exist on Bazantic before — are registered as real Gateways via the `baz` CLI,
pointing at live, deployed endpoints.

**What it does**

Each provider ships a full OpenAPI 3.1 spec (`packages/discovery/openapi/`) written from
the actual running code, registered as a Bazantic Gateway with `auth-type x402-mpp` against
its real Render deployment (`https://wayfare-swift.onrender.com` and siblings) — not a
placeholder or a tunnel. Gateway management required a separate CLI device-login session
(`baz login`), not the dashboard's own API key, since that key only carries read scope.

**Current status, stated plainly**

The three gateways are registered and real, but sit in Bazantic's `draft` status — which,
per Bazantic's own platform design, means the registration exists but doesn't yet proxy
live traffic; that needs `active` status, which in turn needs a payout account configured
on the dashboard (a real banking/KYC step, intentionally left to the account owner rather
than automated). The Recipe combining a Wayfare gateway with an already-listed Bazantic
service is not yet built — Bazantic's Recipes are dashboard-only with no API or CLI path.

**Proof**

- Gateway registrations: `SPONSORS.md` (slugs, endpoints, and the draft-status finding)
- OpenAPI specs: `packages/discovery/openapi/`
- Repo: https://github.com/Aditya-0037/wayfare

**Demo video:** _once the Recipe exists, record it running in Bazantic's Playground —
separate clip from the main Hedera/ENS demo_

---

## Bazantic — Best Recipe Using Sponsor APIs

Same gateway registrations as above. This prize additionally needs a Recipe combining one
of Wayfare's three gateways with an already-listed Bazantic service (PurpleAir or Api
Ninjas were both live on the platform), demonstrated as reusable rather than a one-off —
built by hand on the dashboard once the Recipe itself exists (see status note above).
