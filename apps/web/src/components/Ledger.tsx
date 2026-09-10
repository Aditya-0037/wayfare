import { formatHbar } from "../lib/format";
import type { LedgerEntry } from "../lib/types";
import { EmptyPane } from "./Roster";

const kindStyle: Record<LedgerEntry["kind"], string> = {
  payment: "bg-signal/15 text-signal border-signal/30",
  receipt: "bg-signal2/15 text-signal2 border-signal2/30",
  budget: "bg-fg/10 text-haze border-edge/15",
  refused: "bg-coral/15 text-coral border-coral/30",
};

interface Budget {
  totalSpentTinybars: number;
  maxTotalTinybars: number;
  callsMade: number;
  maxCalls: number;
  remainingTinybars: number;
}

export default function Ledger({ entries, budget }: { entries: LedgerEntry[]; budget: Budget | null }) {
  const spentPct = budget ? Math.min(100, (budget.totalSpentTinybars / Math.max(1, budget.maxTotalTinybars)) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {budget && (
        <div className="rounded-xl border border-edge/10 bg-ink/40 p-4">
          <div className="flex items-center justify-between text-xs text-wisp">
            <span>Spent {formatHbar(budget.totalSpentTinybars)} of {formatHbar(budget.maxTotalTinybars)}</span>
            <span>{budget.callsMade}/{budget.maxCalls} calls</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-fg/5">
            <div className="h-full rounded-full bg-signal transition-all duration-500" style={{ width: `${spentPct}%` }} />
          </div>
          <div className="mt-2 text-xs text-wisp">Remaining: {formatHbar(budget.remainingTinybars)}</div>
        </div>
      )}

      {entries.length === 0 ? (
        <EmptyPane label="Payments and HCS receipts land here as they settle, each linking to a public ledger." />
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((e) => (
            <li key={e.id} className={`rounded-xl border bg-ink/40 px-4 py-3 text-sm ${e.kind === "refused" ? "border-coral/30" : "border-edge/10"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${kindStyle[e.kind]}`}>
                  {e.kind}
                </span>
                <span className="text-[11px] text-wisp">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 font-medium text-fg/90">{e.label}</div>
              <div className="mt-1 break-all font-mono text-xs text-haze">{e.detail}</div>
              {e.href && (
                <a href={e.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-signal">
                  View proof →
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
