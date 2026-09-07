# web (not yet built)

Planned for M7 (Frontend). Three panes — Roster, Reasoning, Ledger. Server-authoritative
state throughout: never compute budget or timing in the browser, only render what the
server sends.

## The WebSocket contract (already live)

`apps/agent` runs a WebSocket server (`npm run serve` from `apps/agent`, default
`ws://localhost:4000`). Connect, send one message to kick off a run:

```json
{ "type": "run", "text": "some text to summarize" }
```

Every connected client then receives the same event stream in real time. Event shapes are
defined in `apps/agent/src/events.ts` (`AgentEvent`) — treat that file as the source of
truth, this list is just a summary:

- `run_started` — text, and the run's budget limits
- `provider_discovered` — one per provider found via ENS (→ Roster)
- `quote_received` / `quote_declined` — per provider, with the reason if declined (→ Roster, Reasoning)
- `decision_made` — which provider was chosen and why, full reasoning trail (→ Reasoning)
- `run_refused` — no affordable candidate, or a guardrail tripped, before any payment (→ Reasoning, Ledger)
- `payment_settled` — amount, tx id, ready-made HashScan URL (→ Ledger)
- `result_delivered` — the provider's actual output
- `receipt_recorded` — HCS topic id, sequence number, ready-made Mirror Node URL (→ Ledger)
- `budget_updated` — running totals (→ Ledger)
- `run_complete` — success/failure, end of the run

Try it now with `apps/agent/scripts/ws-test-client.ts` (`npx tsx scripts/ws-test-client.ts
ws://localhost:4000 "some text"`) to see the exact JSON before building any UI against it.
