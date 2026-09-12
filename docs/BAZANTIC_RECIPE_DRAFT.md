# Bazantic Recipe — ready to paste

Satisfies both eligible Bazantic prizes at once: **Agentify a New API** (the new service is
`deep.wayfare.eth`, genuinely new to Bazantic) and **Best Recipe Using Sponsor APIs** (it
combines that new gateway with an already-listed Bazantic service in one working flow).

This needs your dashboard login, so I can't submit it — but every field below is written
and ready to paste in as-is. Swap the "already-listed service" step for whichever exact
service/endpoint name you see live in your Bazantic dashboard (PurpleAir and Api Ninjas
were both confirmed listed earlier this session — pick whichever has a text/data endpoint
that pairs naturally; Api Ninjas' article/facts-style endpoints fit best).

---

## Recipe name

`Fetch, then summarize — Api Ninjas → Wayfare deep`

## When to use this Recipe

Use this when an agent needs a short, high-quality summary of a live article or block of
text pulled from a real data source, rather than the raw payload. Any time downstream
context is limited (token budget, a chat reply, a notification), the raw source is too
long to hand an agent directly.

## Why this Recipe (not just calling deep.wayfare.eth alone)

`deep.wayfare.eth` only summarizes — it has no way to fetch fresh content on its own. Api
Ninjas supplies the live text. Chaining them turns two single-purpose gateways into a
complete "fetch → summarize" capability neither one provides alone, and the result
genuinely depends on both steps: skip Api Ninjas and there's nothing to summarize; skip
Wayfare and the agent is stuck reasoning over a long, unsummarized payload.

## How it works (step by step)

1. **Call the Api Ninjas gateway** for the text source (e.g. its facts, quotes, or article
   endpoint) with the topic or query the agent was given.
2. **Take the raw text response** from step 1 and pass it as the `text` field to
   `deep.wayfare.eth`'s `/v1/quote` endpoint, with `input_spec.char_count` set to the raw
   text's length.
3. **Pay the quoted price** via x402 (exact scheme, Hedera testnet, HBAR) — this is a real
   on-chain payment, not a mocked call.
4. **Call `/v1/execute`** on `deep.wayfare.eth` with the same text and the `quote_id` from
   step 2, using the `execute_path` bucket the quote returned (small/medium/large).
5. **Return the summary** — a frequency-ranked extractive summary of the original Api
   Ninjas content, typically 20-30% of the original length.

## Example

- **Input:** "Summarize today's top fact about space."
- **Step 1 (Api Ninjas):** returns a 2-3 sentence raw fact.
- **Step 2-4 (Wayfare deep):** quotes ~0.003–0.004 ℏ for that input size, settles on Hedera
  testnet, returns the extractive summary.
- **Output:** the same fact, condensed to its highest-signal sentence, plus (if you want to
  show the payment proof in the Recipe's output) the HashScan link for the settlement and
  the Mirror Node link for the HCS receipt Wayfare anchors for every call.

## Reusability note (for the "not a one-off" requirement)

Nothing about this chain is hardcoded to one topic or article — swap the Api Ninjas query
for any topic, or swap the source gateway entirely for any other Bazantic-listed text
service, and the same "fetch → quote → pay → summarize" shape still works unchanged.
`deep.wayfare.eth`'s pricing and behavior don't depend on which upstream gateway produced
the text.

## Screen recording checklist (for the required demo clip)

1. Open Bazantic's Playground.
2. Run the Api Ninjas call, show the raw (long) response.
3. Run `deep.wayfare.eth` on that response, show the quote, the payment, and the shorter
   summary that comes back.
4. Optionally paste the real HashScan/Mirror Node links from that specific run to show the
   payment actually settled, not simulated.
5. State your Bazantic account username/email in the submission per their requirement.
