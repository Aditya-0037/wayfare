import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentEvent } from "../lib/types";
import { ACHIEVEMENTS, loadUnlocked, saveUnlocked, type Achievement } from "../lib/achievements";
import { sfx } from "../lib/sfx";

// Badges are derived purely from the real WebSocket event log (see achievements.ts) — this
// component only decides when to show a toast for a newly-true check and persists which
// ids have already fired, so a page refresh doesn't replay every badge from scratch.
export default function AchievementToast({ rawLog }: { rawLog: AgentEvent[] }) {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const unlockedRef = useRef<Set<string>>(loadUnlocked());

  useEffect(() => {
    if (rawLog.length === 0) return;
    const newlyUnlocked: Achievement[] = [];
    for (const a of ACHIEVEMENTS) {
      if (unlockedRef.current.has(a.id)) continue;
      if (a.check(rawLog)) newlyUnlocked.push(a);
    }
    if (newlyUnlocked.length > 0) {
      for (const a of newlyUnlocked) unlockedRef.current.add(a.id);
      saveUnlocked(unlockedRef.current);
      setQueue((q) => [...q, ...newlyUnlocked]);
      sfx.achievement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawLog.length]);

  useEffect(() => {
    if (queue.length === 0) return;
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), 4200);
    return () => clearTimeout(timer);
  }, [queue]);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {queue.slice(0, 1).map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto flex max-w-xs items-start gap-3 rounded-2xl border border-signal/30 bg-panel/95 p-4 shadow-glow backdrop-blur"
          >
            <a.icon weight="duotone" className="h-7 w-7 shrink-0 text-signal" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-signal">Achievement unlocked</div>
              <div className="mt-0.5 font-display text-sm font-semibold text-fg">{a.title}</div>
              <div className="mt-1 text-xs leading-snug text-haze">{a.description}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
