# web (not yet built)

Planned for M7 (Frontend). Three panes — Roster, Reasoning, Ledger — driven by
WebSocket events emitted from the agent runtime (`provider_discovered`,
`quote_received`, `decision_made`, `payment_settled`, `result_delivered`,
`budget_updated`, `run_complete`). Server-authoritative state throughout.
