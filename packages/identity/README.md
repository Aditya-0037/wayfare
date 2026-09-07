# identity

ENS resolution and setup for Wayfare's providers, on real ENSv2 (beta) on Sepolia —
not the older v1 registry.

`wayfare.eth` is registered. `swift.wayfare.eth` is live with `agent-context` and
`agent-endpoint[web]` set, and `wayfare.reputation` gated by Enhanced Access Control: a
separate settlement-recorder key holds the only grant to write that one text key, verified
by actually attempting writes from both keys on-chain (`npm run verify-eac`), not just
asserted.

`agent-endpoint[mcp]` isn't set yet — there's no real Bazantic MCP gateway to point it at
until M5, and this project doesn't set records to endpoints that don't do anything.

## Setup scripts (already run once against Sepolia; re-run only if starting fresh)

- `npm run register-root` — registers `ENS_PARENT_NAME` (default `wayfare.eth`)
- `npm run setup-provider swift <subregistryAddress>` — creates a provider subname with its
  own dedicated resolver, sets its records, grants the reputation role
- `npm run resolve <label>` — reads a provider back exactly as the agent will
- `npm run verify-eac <name> <resolverAddress>` — proves the access control, doesn't just claim it

## Why this took more than the SDK's README suggested

`@ensdomains/ensjs@5.0.0-sepolia-fix.1` is the ENS team's own preview for writing to
ENSv2 on Sepolia, but several of its actions don't match what's actually deployed:

- `getRegisterPrice`'s ABI doesn't match the live `ETHRegistrar` — the real function is
  `rentPrice(label, owner, duration, paymentToken)`.
- Its hardcoded L2 USDC address isn't accepted by the live price oracle. The real one was
  found from the oracle's `PaymentTokenAdded` event log and confirmed via `isPaymentToken`.
- Its `setTextRecord` / `grantResolverRoles` wallet actions target the older, node-aware
  multi-tenant resolver interface. The resolver actually deployed for ENSv2-on-Sepolia is
  `DedicatedResolver` — one resolver per name, `setText(key, value)` with no node argument
  at all, and generic `grantRoles(resource, roleBitmap, account)` for Enhanced Access
  Control instead of the name-scoped grant functions ensjs exposes.

`src/dedicatedResolver.ts` and `src/registry.ts` call the verified real interfaces directly
(fetched from Blockscout's verified source for each contract) instead of going through the
mismatched SDK actions. `src/chain.ts` documents where each contract address came from.
