// Playful decorative 3D-ish orbs — pure CSS (gradients + blur + animation), no heavy deps.
export default function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -left-16 top-24 h-72 w-72 rounded-full blur-3xl animate-float-slow"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(125,255,179,0.35), rgba(125,255,179,0) 70%)" }}
      />
      <div
        className="absolute right-0 top-10 h-96 w-96 rounded-full blur-3xl animate-float2"
        style={{ background: "radial-gradient(circle at 40% 40%, rgba(125,184,255,0.3), rgba(125,184,255,0) 70%)" }}
      />
      <div
        className="absolute left-1/3 bottom-0 h-64 w-64 rounded-full blur-3xl animate-float"
        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,179,125,0.22), rgba(255,179,125,0) 70%)" }}
      />

      {/* small orbiting facets for depth */}
      <div className="absolute right-[18%] top-[22%] h-3 w-3 rounded-full bg-signal/70 shadow-glow animate-float" />
      <div className="absolute right-[26%] top-[38%] h-2 w-2 rounded-full bg-signal2/70 shadow-glow2 animate-float2" />
      <div className="absolute right-[10%] top-[52%] h-2.5 w-2.5 rounded-full bg-amber/70 animate-float-slow" />

      <div className="absolute inset-0 bg-grid-mask" />
    </div>
  );
}
