// Playful decorative accents — flat colors softened only by CSS blur, no gradients. The
// --orb-strength scalar (index.css) tunes intensity per theme so this doesn't wash out
// light mode or oversaturate dark mode.
export default function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-16 top-24 h-72 w-72 rounded-full blur-3xl animate-float-slow"
        style={{ background: "rgb(var(--c-signal) / calc(0.22 * var(--orb-strength)))" }}
      />
      <div
        className="absolute right-0 top-10 h-96 w-96 rounded-full blur-3xl animate-float2"
        style={{ background: "rgb(var(--c-signal2) / calc(0.18 * var(--orb-strength)))" }}
      />
      <div
        className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full blur-3xl animate-float"
        style={{ background: "rgb(var(--c-amber) / calc(0.14 * var(--orb-strength)))" }}
      />

      {/* Small orbiting facets for depth — positioned assuming the hero's wide two-column
          layout, where they land over the empty compass-rig side. Below that breakpoint the
          hero stacks into one column and these same percentages land on the headline/body
          text instead, so they're desktop-only. */}
      <div className="absolute right-[18%] top-[22%] hidden h-3 w-3 rounded-full bg-signal/70 shadow-glow animate-float lg:block" />
      <div className="absolute right-[26%] top-[38%] hidden h-2 w-2 rounded-full bg-signal2/70 shadow-glow2 animate-float2 lg:block" />
      <div className="absolute right-[10%] top-[52%] hidden h-2.5 w-2.5 rounded-full bg-amber/70 animate-float-slow lg:block" />
    </div>
  );
}
