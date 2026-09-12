import { AnimatePresence, motion } from "framer-motion";

export interface ConfettiParticle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
}

export function makeParticles(emoji: string[], count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    emoji: emoji[i % emoji.length],
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
  }));
}

// Shared burst mechanics for both the Konami easter egg and the real payment-success
// celebration — same particles, different trigger and caption.
export default function Confetti({ active, particles, caption }: { active: boolean; particles: ConfettiParticle[]; caption?: string }) {
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
          {caption && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-signal/30 bg-ink/90 px-5 py-2.5 font-mono text-xs text-signal shadow-glow"
            >
              {caption}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
