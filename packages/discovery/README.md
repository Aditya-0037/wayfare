# discovery (M5 — blocked on Bazantic application)

Bazantic isn't self-serve — registering a provider or getting developer access both go
through a form + human review (up to 2 business days), so applying early matters more than
the content of the application itself.

## 1. Provider application — bazantic.com/become-a-provider

Turns swift/deep/niche into Bazantic-routed x402 gateways. Needed for the "Agentify a new
API" bounty. Paste:

- **Company/project name:** Wayfare
- **Work email:** (yours)
- **OpenAPI spec or docs URL:** paste the repo link
  (`https://github.com/Aditya-0037/wayfare`) or attach the specs in `openapi/` —
  `swift.yaml`, `deep.yaml`, `niche.yaml`. Written from the actual running code, not
  aspirational — every path, status code, and schema matches what's deployed.
- **Test API key:** not applicable — these are x402-gated (pay-per-call), not API-key
  gated. Say so in the form; point at `apps/providers/*/README` for the payment flow.

## 2. Developer beta access — bazantic.com/developers

Needed so the *agent* can reach gateways through Bazantic's MCP server, for the "Best
Recipe" bounty. Paste:

- **Name / email / company:** yours / Wayfare
- **Problem description:** something like — "Our agent discovers services entirely at
  runtime (ENS resolution, zero hardcoded endpoints) and pays per call over x402 on Hedera.
  We want to route that same discovery-and-pay loop through Bazantic's MCP gateway and
  measure whether a Recipe measurably improves the agent's tool-selection accuracy versus
  no Recipe (A/B harness, see below)."

## Once accepted

- Register each provider as a Gateway using the specs in `openapi/`.
- Write one Recipe per provider (when to use it, what it needs, how to read the result) —
  the same reasoning already encoded in each provider's `agent-context` ENS record and in
  `apps/agent/src/decide.ts`'s quality ranking.
- Point the agent at providers through the Bazantic MCP server instead of direct HTTP.
- A/B artifact: same task, same model, same settings, Recipe present vs. absent — log
  success rate, token spend, and malformed-call rate over N runs.

Nothing beyond the specs can be built until the application clears — Bazantic's actual API
surface (gateway registration format, MCP server URL, Recipe schema) isn't documented
anywhere public until you're in.
