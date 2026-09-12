import { Trophy, WarningCircle, XCircle } from "@phosphor-icons/react";
import { EmptyPane } from "./Roster";

export default function Reasoning({ trail, chosen, refusedReason }: { trail: string[]; chosen: string | null; refusedReason: string | null }) {
  if (trail.length === 0 && !refusedReason) {
    return <EmptyPane label="The agent's reasoning trail — why it picked what it picked — shows up here." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {chosen !== null && (
        <div className="flex items-center gap-2 rounded-xl border border-signal/30 bg-signal/5 px-4 py-3 text-sm">
          <Trophy weight="fill" className="h-4 w-4 shrink-0 text-signal" />
          <span className="text-wisp">Chosen provider: </span>
          <span className="font-mono text-signal">{chosen}</span>
        </div>
      )}
      {chosen === null && trail.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
          <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
          No provider was chosen.
        </div>
      )}
      <ol className="flex flex-col gap-2">
        {trail.map((line, i) => (
          <li key={i} className="flex gap-3 rounded-lg border border-edge/10 bg-ink/40 px-4 py-2.5 text-sm leading-relaxed text-haze">
            <span className="mt-0.5 font-mono text-xs text-wisp">{String(i + 1).padStart(2, "0")}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
      {refusedReason && (
        <div className="flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-coral">
          <XCircle weight="fill" className="h-4 w-4 shrink-0" />
          Run refused: {refusedReason}
        </div>
      )}
    </div>
  );
}
