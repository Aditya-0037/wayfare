# identity (not yet built)

Planned for M2 (ENS resolution). Per ENSIP-26: resolve a provider subname
(e.g. `swift.wayfare.eth`) on Sepolia, read its `agent-context` text record,
then optionally `agent-endpoint[mcp]` / `agent-endpoint[web]`. If
`agent-context` is absent, treat the name as undiscoverable — no fallback.

Also owns the `wayfare.reputation` record writes, gated by Enhanced Access
Control so only the settlement recorder (not the provider itself) can write it.
