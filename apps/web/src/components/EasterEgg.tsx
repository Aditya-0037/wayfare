import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const EMOJI = ["🐢", "🚀", "🧭", "💰", "📜", "🛰️", "🪙"];

// Purely cosmetic — the classic Konami code triggers a burst of emoji confetti and a wink
// at the project's own pitch. Nothing here touches agent state, budgets, or the event log.
export default function EasterEgg() {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);

  useEffect(() => {
    let progress = 0;
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      progress = key === CODE[progress] ? progress + 1 : key === CODE[0] ? 1 : 0;
      if (progress === CODE.length) {
        progress = 0;
        trigger();
      }
    }
    function trigger() {
      setActive(true);
      setParticles(
        Array.from({ length: 28 }, (_, i) => ({
          id: i,
          emoji: EMOJI[i % EMOJI.length],
          x: Math.random() * 100,
          delay: Math.random() * 0.6,
        })),
      );
      setTimeout(() => setActive(false), 3200);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              className="absolute top-[-40px] text-3xl"
              style={{ left: `${p.x}%` }}
              initial={{ y: -40, opacity: 0, rotate: 0 }}
              animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 }}
              transition={{ duration: 2.6, delay: p.delay, ease: "easeIn" }}
            >
              {p.emoji}
            </motion.span>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-signal/30 bg-ink/90 px-5 py-2.5 font-mono text-xs text-signal shadow-glow"
          >
            no cheat codes for the treasury — the agent still checks its own budget
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
