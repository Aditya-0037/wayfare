import { CheckCircle } from "@phosphor-icons/react";

export default function ResultPanel({ result }: { result: unknown }) {
  if (result === null || result === undefined) return null;
  const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);

  return (
    <div className="mt-6 rounded-2xl border border-signal/20 bg-signal/5 p-5">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-signal">
        <CheckCircle weight="fill" className="h-3.5 w-3.5" />
        Result delivered
      </h4>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-fg/90">{text}</pre>
    </div>
  );
}
