# web

React + Vite + Tailwind. A landing page plus a live console that talks to the agent's
WebSocket server — three panes (Roster, Reasoning, Ledger), server-authoritative
throughout: the browser only renders `AgentEvent`s (`apps/agent/src/events.ts`), it never
computes budget, timing, or the decision itself.

## Running it

1. Start the agent's WebSocket server: from `apps/agent`, `npm run serve` (needs the
   Hedera env vars — see the root README).
2. Start the three providers (`npm run dev:swift` / `dev:deep` / `dev:niche` from repo root).
3. `npm run dev -w @wayfare/web` (or `cd apps/web && npm run dev`) — serves on
   `http://localhost:5173`.
4. Optional: copy `.env.example` → `.env` to point `VITE_WS_URL` somewhere other than
   `ws://localhost:4000`.

Open the page, scroll to "Run it yourself", connect, and submit text. Try the markdown-list
sample to see `niche` accept it and the plain-paragraph sample to see it decline (422)
before any payment.
