import { motion, AnimatePresence } from "framer-motion";
import { formatHbar } from "../lib/format";
import type { ProviderState } from "../lib/types";

// A retro, isometric "trading floor" — one voxel NPC per provider. Every animation here
// is driven directly by ProviderState.status, which the server computes from real events —
// there's no separate visual-only state machine to drift out of sync with the console.
// The three known providers get a fixed slot (so the layout doesn't jump run to run); any
// provider the agent discovers that isn't one of these three still gets a slot, cycling
// through the same palette, so this never silently drops a provider Roster would show.
const KNOWN_SLOTS: Record<string, { hue: string; glow: string }> = {
  swift: { hue: "bg-signal2", glow: "shadow-glow2" },
  deep: { hue: "bg-signal", glow: "shadow-glow" },
  niche: { hue: "bg-amber", glow: "shadow-glowAmber" },
};
const KNOWN_ORDER = Object.keys(KNOWN_SLOTS);
const FALLBACK_PALETTE = [KNOWN_SLOTS.swift, KNOWN_SLOTS.deep, KNOWN_SLOTS.niche];

export default function AgentStage({
  providers,
  chosen,
  runEnded,
}: {
  providers: ProviderState[];
  chosen: string | null;
  runEnded: boolean;
}) {
  const byName = new Map(providers.map((p) => [p.provider, p] as const));
  const extraKeys = providers.map((p) => p.provider).filter((k) => !KNOWN_ORDER.includes(k));
  const slots = [
    ...KNOWN_ORDER.map((key) => ({ key, label: key, ...KNOWN_SLOTS[key] })),
    ...extraKeys.map((key, i) => ({ key, label: key, ...FALLBACK_PALETTE[i % FALLBACK_PALETTE.length] })),
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-edge/10 bg-panel/50 p-6 [perspective:1200px]">
      <div className="flex flex-wrap items-end justify-center gap-10 py-6 [transform-style:preserve-3d]" style={{ transform: "rotateX(8deg)" }}>
        {slots.map((slot) => (
          <Npc key={slot.key} slot={slot} state={byName.get(slot.key)} isChosen={chosen === slot.key} runEnded={runEnded} />
        ))}
      </div>
    </div>
  );
}

function Npc({
  slot,
  state,
  isChosen,
  runEnded,
}: {
  slot: { key: string; label: string; hue: string; glow: string };
  state?: ProviderState;
  isChosen: boolean;
  runEnded: boolean;
}) {
  const status = state?.status;
  const waiting = !state;
  const neverShowedUp = waiting && runEnded;
  const declined = status === "declined";
  const paid = status === "paid";
  const hasQuote = typeof state?.quotePriceTinybars === "number";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* speech bubble: quote price, or decline reason, or waiting dots */}
      <div className="h-8">
        <AnimatePresence mode="wait">
          {hasQuote && !declined ? (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-full border border-signal2/30 bg-ink/80 px-3 py-1 font-mono text-[11px] text-signal2"
            >
              {hasQuote ? formatHbar(state!.quotePriceTinybars!) : ""}
            </motion.div>
          ) : declined ? (
            <motion.div
              key="declined"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-full border border-coral/30 bg-ink/80 px-3 py-1 font-mono text-[11px] text-coral"
            >
              ✕ declined
            </motion.div>
          ) : (
            <motion.div key="spacer" className="h-full w-full" />
          )}
        </AnimatePresence>
      </div>

      {/* voxel body */}
      <motion.div
        className="relative [transform-style:preserve-3d]"
        animate={
          declined
            ? { rotateZ: [0, -6, 6, -4, 0], opacity: 0.35 }
            : neverShowedUp
              ? { y: 0, opacity: 0.25 }
              : waiting
                ? { y: [0, -2, 0], opacity: 0.5 }
                : isChosen
                  ? { y: [0, -6, 0], scale: 1.12 }
                  : { y: [0, -4, 0], scale: 1 }
        }
        transition={
          declined || neverShowedUp
            ? { duration: 0.5 }
            : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {isChosen && (
          <div
            className="absolute -inset-6 -z-10 rounded-full opacity-60 blur-xl"
            style={{ background: "rgb(var(--c-signal) / calc(0.35 * var(--orb-strength)))" }}
          />
        )}
        {/* head */}
        <div className={`mx-auto h-4 w-4 rounded-sm ${waiting ? "bg-wisp/30" : slot.hue} ${!waiting && !declined ? slot.glow : ""}`} />
        {/* body */}
        <div className={`mt-0.5 h-6 w-8 rounded-sm ${waiting ? "bg-wisp/20" : slot.hue} ${!waiting && !declined ? slot.glow : ""} opacity-90`} />

        <AnimatePresence>
          {paid && (
            <motion.span
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -28, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute left-1/2 top-0 -translate-x-1/2 text-sm"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <span className={`font-mono text-xs uppercase tracking-wide ${waiting ? "text-wisp/50" : isChosen ? "text-fg" : "text-haze"}`}>
        {slot.label}
        {neverShowedUp && <span className="ml-1 normal-case text-wisp/40">· not reached</span>}
      </span>
    </div>
  );
}
