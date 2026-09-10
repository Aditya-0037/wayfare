# Demo script

~2.5 minutes. Screen-record either `https://wayfare-web.onrender.com` (the public instance
— nothing to start, just open it) or `http://localhost:5173` with the full stack running
locally. Narration is a starting point, not a script to read robotically — say it in your
own words, but hit every beat, since each one maps to a specific judged claim.

## Before you hit record

**Public instance (simpler):** just open `https://wayfare-web.onrender.com` — it already
points at the live public agent. That agent runs tighter guardrails than local dev (a
cooldown between runs, a lower spend cap) since it's reachable by anyone, so if a run
refuses for budget reasons, that's the safeguard working as intended, not a bug — re-run
locally for the budget-comparison beat below if you want a bigger number on screen.

**Local instead, if you want full control over budgets for Beat 3:**
- All three providers running (`npm run dev:swift` / `dev:deep` / `dev:niche`).
- Agent WS server running (`apps/agent`: `npm run serve`).
- Frontend running (`apps/web`: `npm run dev`), page loaded, scrolled to the top.

Either way, have a second browser tab ready, pinned to
`https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages` (receipts)
or a HashScan tab, to cut to after the run.

## Beat 1 — the claim (0:00–0:15)

Show the hero. Say the line the whole project is built around:

> "Every agentic-payments demo hardcodes its endpoints — the agent already knows every
> seller before it runs. Wayfare's agent doesn't. It gets a task and a budget, and finds
> its own sellers at runtime."

Scroll to "A real market, not a menu" — point at the three provider cards for two seconds,
enough to read `swift` / `deep` / `niche` and their one-line traits.

## Beat 2 — discover, decide, pay (0:15–1:00)

Scroll to "Run it yourself." Click **Connect to agent** (status flips to Connected).

Click the **Markdown list** sample chip, then **Start run**. Narrate as it streams:

> "It's reading ENS event logs right now — not a config file — to find out what sellers
> exist. Three come back. It asks each one for a quote. Watch niche —"

Point at niche declining (or, if you used the plain-paragraph sample instead, watch niche
reject it with a 422 right there in the Roster) —

> "— that one only handles structured lists, and it says so before any money moves, not
> after. The agent picks the best one it can actually afford, and pays it for real, on
> Hedera testnet."

Let the Ledger populate: payment entry, then the HCS receipt entry.

> "Every settled call gets a receipt anchored to Hedera Consensus Service. That link
> isn't ours to fake — anyone can pull it from Mirror Node independently."

Click **View proof** on the receipt entry — let the Mirror Node tab load for a beat.

## Beat 3 — budget changes the outcome (1:00–1:30)

Re-run with a small budget (either re-run the console with a tighter cap, or cut to a
terminal: `MAX_TOTAL_TINYBARS=150000 MAX_PRICE_PER_CALL_TINYBARS=150000 npx tsx
src/index.ts "..."` from `apps/agent`).

> "Same task, smaller budget — and it picks a different provider. Cheaper, lower quality,
> logged reasoning right there: 'highest quality affordable.' Nobody hardcoded that
> choice — the numbers did."

## Beat 4 — the identity layer (1:30–2:00)

Cut to a terminal. Show one command proving ENS is load-bearing, not decorative:

```
grep -r "provider.*http" apps/agent/src
```

> "That returns nothing. No provider URL exists anywhere in the agent's source — it finds
> them over ENS every time it runs."

Then show the Enhanced Access Control proof (`packages/identity/README.md` has the exact
command) — or just say it while showing the terminal output already captured there:

> "Each provider's reputation record can only be updated by one specific key — not even
> the deployer's own admin key can touch it. That's enforced on-chain, not by convention,
> and I proved it by actually trying to write from the wrong key and watching it revert."

## Beat 5 — close (2:00–2:20)

Back to the browser, Ledger pane in view.

> "Discover, assess, decide, pay, and prove — all at runtime, all independently checkable
> on HashScan and Mirror Node. The agent doesn't know its own tools until it looks."

End on the HashScan tab.

## Notes for cutting this down per sponsor

- **Hedera submission (≤5 min):** the full script fits with room to spare — keep all of it.
- **ENS submission:** lean on Beats 2 and 4 (discovery + EAC); trim Beat 3.
- **Bazantic submission(s):** once the Recipe exists, add a beat showing it running in
  their Playground — record that separately since it's a different surface entirely.
