import { useState } from "react";
import { useAgentRun } from "../lib/useAgentRun";
import Roster from "./Roster";
import Reasoning from "./Reasoning";
import Ledger from "./Ledger";
import ResultPanel from "./ResultPanel";

const samples = [
  {
    label: "Plain paragraph",
    text: "Wayfare is an agent that starts a task with a budget instead of a hardcoded list of tools. It resolves providers at runtime over ENS, requests live quotes, and chooses between them on price and quality before paying per call on Hedera testnet via the x402 protocol. Every settled call is anchored to a Hedera Consensus Service topic, so anyone can independently verify who was paid, how much, and what was delivered.",
  },
  {
    label: "Markdown list (routes to niche)",
    text: "- Buy the flight before Tuesday\n- Confirm the hotel has late checkout\n- Pack the charger and the passport\n- Email the itinerary to the team\n- Set an alarm for the 6am transfer",
  },
];

const phaseCopy: Record<string, { label: string; dot: string }> = {
  idle: { label: "Idle", dot: "bg-wisp" },
  running: { label: "Running", dot: "bg-signal2 animate-pulseSoft" },
  refused: { label: "Refused", dot: "bg-coral" },
  success: { label: "Complete", dot: "bg-signal" },
  failed: { label: "Failed", dot: "bg-coral" },
};

const connCopy: Record<string, { label: string; dot: string }> = {
  idle: { label: "Not connected", dot: "bg-wisp" },
  connecting: { label: "Connecting…", dot: "bg-amber animate-pulseSoft" },
  open: { label: "Connected", dot: "bg-signal" },
  closed: { label: "Disconnected", dot: "bg-wisp" },
  error: { label: "Connection error", dot: "bg-coral" },
};

export default function RunConsole() {
  const { connection, connect, phase, providers, reasoning, chosen, ledger, budget, result, refusedReason, startRun } = useAgentRun();
  const [text, setText] = useState(samples[0].text);

  const busy = phase === "running";
  const providerList = Object.values(providers);

  function handleRun() {
    if (!text.trim() || busy) return;
    startRun(text.trim());
  }

  return (
    <section id="console" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Run it yourself</h2>
            <p className="mt-3 max-w-xl text-haze">
              This talks to the live agent over WebSocket — every event below is broadcast
              straight from the server. Nothing rendered here is computed in the browser.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-edge/10 bg-panel/60 px-3 py-1.5 text-xs text-haze">
            <span className={`h-1.5 w-1.5 rounded-full ${connCopy[connection].dot}`} />
            {connCopy[connection].label}
          </div>
        </div>

        {/* Input */}
        <div className="mt-10 rounded-2xl border border-edge/10 bg-panel/50 p-5 shadow-card">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-wisp">Try:</span>
            {samples.map((s) => (
              <button
                key={s.label}
                onClick={() => setText(s.text)}
                className="rounded-full border border-edge/10 px-3 py-1 text-xs text-haze transition hover:border-signal/30 hover:text-fg"
              >
                {s.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Give the agent something to summarize…"
            className="w-full resize-none rounded-xl border border-edge/10 bg-ink/60 p-4 font-mono text-sm text-fg/90 outline-none placeholder:text-wisp focus:border-signal/40"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-wisp">
              <span className={`h-1.5 w-1.5 rounded-full ${phaseCopy[phase].dot}`} />
              {phaseCopy[phase].label}
              {budget && (
                <span className="ml-2 hidden text-wisp/70 sm:inline">
                  · budget set server-side: max {budget.maxCalls} calls, {(budget.maxTotalTinybars / 1e8).toLocaleString()} ℏ cap
                </span>
              )}
            </div>
            <button
              onClick={connection === "idle" || connection === "closed" ? connect : handleRun}
              disabled={busy || (!text.trim() && connection === "open")}
              className="rounded-full bg-signal px-6 py-2.5 text-sm font-semibold text-onaccent shadow-glow transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connection === "idle" || connection === "closed"
                ? "Connect to agent"
                : busy
                  ? "Running…"
                  : "Start run"}
            </button>
          </div>
          {connection === "error" && (
            <p className="mt-3 text-xs text-coral">
              Couldn't reach the agent's WebSocket server. Start it with <code className="font-mono">npm run dev:agent -- serve</code> (or
              from <code className="font-mono">apps/agent</code>: <code className="font-mono">npm run serve</code>), then reconnect.
            </p>
          )}
        </div>

        {result !== null && result !== undefined && <ResultPanel result={result} />}

        {/* Three panes */}
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Pane title="Roster" subtitle="Providers discovered over ENS">
            <Roster providers={providerList} chosen={chosen} />
          </Pane>
          <Pane title="Reasoning" subtitle="Why the agent chose what it chose">
            <Reasoning trail={reasoning} chosen={chosen} refusedReason={refusedReason} />
          </Pane>
          <Pane title="Ledger" subtitle="Payments, budget, and HCS receipts">
            <Ledger entries={ledger} budget={budget} />
          </Pane>
        </div>
      </div>
    </section>
  );
}

function Pane({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-edge/10 bg-panel/40 p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-xs text-wisp">{subtitle}</p>
      </div>
      <div className="max-h-[480px] overflow-y-auto pr-1">{children}</div>
    </div>
  );
}
