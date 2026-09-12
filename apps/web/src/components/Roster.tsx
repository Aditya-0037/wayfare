import { CheckCircle } from "@phosphor-icons/react";
import { formatHbar, shortAddr } from "../lib/format";
import type { ProviderState } from "../lib/types";

const statusStyle: Record<ProviderState["status"], string> = {
  discovered: "border-edge/10 text-wisp",
  quoted: "border-signal2/30 text-signal2",
  declined: "border-coral/30 text-coral",
  chosen: "border-signal/40 text-signal",
  paid: "border-signal/40 text-signal",
};

const statusLabel: Record<ProviderState["status"], string> = {
  discovered: "discovered",
  quoted: "quoted",
  declined: "declined",
  chosen: "chosen",
  paid: "paid",
};

export default function Roster({ providers, chosen }: { providers: ProviderState[]; chosen: string | null }) {
  if (providers.length === 0) {
    return <EmptyPane label="Providers will appear here as the agent discovers them over ENS." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {providers.map((p) => (
        <div
          key={p.provider}
          className={`rounded-xl border bg-ink/40 p-4 transition ${p.provider === chosen ? "border-signal/40 shadow-glow" : "border-edge/10"}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm text-fg">{p.name}</span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${statusStyle[p.status]}`}>
              {p.status === "paid" && <CheckCircle weight="fill" className="h-3 w-3" />}
              {statusLabel[p.status]}
            </span>
          </div>
          {p.agentContext && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-haze" title={p.agentContext}>
              {p.agentContext}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-wisp">
            {typeof p.quotePriceTinybars === "number" && (
              <span className="text-signal2">quote: {formatHbar(p.quotePriceTinybars)}</span>
            )}
            {p.declinedReason && <span className="text-coral">{p.declinedReason}</span>}
            {p.reputation && (
              <span>
                {p.reputation.completed_calls} calls
                {p.reputation.mean_latency_ms ? ` · ${Math.round(p.reputation.mean_latency_ms)}ms avg` : ""}
                {p.reputation.disputes > 0 ? ` · ${p.reputation.disputes} disputes` : ""}
              </span>
            )}
          </div>
          {Object.entries(p.endpoints ?? {}).length > 0 && (
            <div className="mt-2 truncate font-mono text-[11px] text-wisp/70">
              {Object.entries(p.endpoints)
                .map(([k, v]) => `${k}: ${shortAddr(v, 18, 10)}`)
                .join("  ·  ")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function EmptyPane({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl border border-dashed border-edge/10 p-6 text-center text-sm text-wisp">
      {label}
    </div>
  );
}
