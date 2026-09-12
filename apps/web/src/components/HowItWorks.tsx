import { Lightning, Brain, Target, MagnifyingGlass, Tag, Scales, Anchor } from "@phosphor-icons/react";
import TiltCard from "./TiltCard";

const providers = [
  {
    name: "swift.wayfare.eth",
    tag: "cheap · shallow",
    icon: Lightning,
    color: "signal" as const,
    desc: "First two sentences, verbatim. Flat fee, near-instant. Good when the budget is tight or the task is trivial.",
  },
  {
    name: "deep.wayfare.eth",
    tag: "thorough · metered",
    icon: Brain,
    color: "signal2" as const,
    desc: "Frequency-ranked extractive summary over the whole input. Slower, better, priced by a bucketed input-size tier.",
  },
  {
    name: "niche.wayfare.eth",
    tag: "specialist · strict",
    icon: Target,
    color: "amber" as const,
    desc: "Only handles markdown-style lists. Rejects anything else with a 422 at quote time — before any payment is made.",
  },
];

const colorMap = {
  signal: { text: "text-signal", ring: "ring-signal/30", glow: "rgb(var(--c-signal) / calc(0.18 * var(--orb-strength)))" },
  signal2: { text: "text-signal2", ring: "ring-signal2/30", glow: "rgb(var(--c-signal2) / calc(0.18 * var(--orb-strength)))" },
  amber: { text: "text-amber", ring: "ring-amber/30", glow: "rgb(var(--c-amber) / calc(0.18 * var(--orb-strength)))" },
};

const steps = [
  { n: "01", title: "Discover", icon: MagnifyingGlass, body: "Reads NameRegistered logs off wayfare.eth's ENS subregistry. No provider URL is hardcoded anywhere in the agent." },
  { n: "02", title: "Quote", icon: Tag, body: "Asks every discovered provider for a live price. Anything that can't handle the input declines at quote time, before payment." },
  { n: "03", title: "Decide", icon: Scales, body: "Picks the best affordable option on price and quality, and logs the full reasoning trail — not a black box." },
  { n: "04", title: "Pay & anchor", icon: Anchor, body: "Settles per call over x402 on Hedera testnet, then anchors provider, price, tx id and result hash to one HCS topic." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative border-b border-edge/10 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">A real market, not a menu</h2>
          <p className="mt-4 text-lg text-haze">
            Three independent providers compete for the same task. The agent has never seen
            their endpoints before — it finds them, prices them, and chooses, every run.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {providers.map((p) => {
            const c = colorMap[p.color];
            return (
              <TiltCard key={p.name} glow={c.glow} className="rounded-2xl">
                <div className={`h-full rounded-2xl border border-edge/10 bg-panel/60 p-6 shadow-card ring-1 ${c.ring} backdrop-blur`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-sm ${c.text}`}>{p.name}</span>
                    <p.icon weight="duotone" className={`h-5 w-5 ${c.text}`} />
                  </div>
                  <span className="mt-3 inline-block rounded-full border border-edge/10 px-2.5 py-1 text-[11px] uppercase tracking-wide text-wisp">
                    {p.tag}
                  </span>
                  <p className="mt-4 text-sm leading-relaxed text-haze">{p.desc}</p>
                </div>
              </TiltCard>
            );
          })}
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative border-l border-edge/10 pl-5">
              <div className="flex items-center gap-2">
                <s.icon weight="duotone" className="h-5 w-5 text-signal" />
                <span className="font-mono text-xs text-wisp">{s.n}</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-haze">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
