import { motion } from "framer-motion";
import FloatingOrbs from "./FloatingOrbs";
import CompassRig from "./CompassRig";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Hero() {
  return (
    <section id="top" className="relative border-b border-edge/5">
      <FloatingOrbs />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-24">
        {/* Left column carries the F-pattern's primary scan path: eyebrow -> headline -> subhead -> CTA -> stat row */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-edge/10 bg-fg/5 px-3 py-1 text-xs font-medium text-haze"
          >
            <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-signal" />
            Live on Hedera testnet · settling real x402 payments
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            An agent that <span className="text-signal">shops the open market</span> — it doesn't call a list you hardcoded.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-haze"
          >
            Give Wayfare a task and a budget. It resolves sellers at runtime over ENS, gets
            live quotes, picks on price and quality, pays per call on Hedera, and anchors a
            receipt to HCS for every provider it ever deals with.
          </motion.p>

          <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={() => scrollTo("console")}
              className="group relative overflow-hidden rounded-full bg-signal px-7 py-3.5 text-sm font-semibold text-onaccent shadow-glow transition hover:brightness-110 active:scale-95"
            >
              <span className="relative z-10">Run a live task →</span>
            </button>
            <button
              onClick={() => scrollTo("how")}
              className="rounded-full border border-edge/15 px-7 py-3.5 text-sm font-semibold text-fg/90 transition hover:border-edge/30 hover:bg-fg/5"
            >
              See how it decides
            </button>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="show"
            custom={4}
            variants={fadeUp}
            className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-edge/10 pt-8"
          >
            <div>
              <dt className="text-xs uppercase tracking-wide text-wisp">Providers</dt>
              <dd className="mt-1 font-display text-lg font-semibold text-fg sm:text-2xl">3 live</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-wisp">Discovery</dt>
              <dd className="mt-1 font-display text-lg font-semibold text-fg sm:text-2xl">ENS, real-time</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-wisp">Receipts</dt>
              <dd className="mt-1 font-display text-lg font-semibold text-fg sm:text-2xl">Anchored to HCS</dd>
            </div>
          </motion.dl>
        </div>

        {/* Right column — visual weight, secondary to the F-pattern's left-hand scan */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative flex items-center justify-center"
        >
          <div className="absolute inset-0 -z-10 rounded-[3rem] border border-edge/10 bg-panel/70 shadow-card" />
          <CompassRig />
        </motion.div>
      </div>
    </section>
  );
}
