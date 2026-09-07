// Tiny retro sound effects, synthesized on the fly with the Web Audio API — no audio
// files to ship. Every call here is triggered by a real AgentEvent (see RunConsole), never
// decorative on its own. Muted by default in a fresh browser (see useSfx) until the user
// opts in, since autoplaying audio on a hackathon judge's laptop is its own kind of bug.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function beep(freq: number, startOffset: number, durationSec: number, type: OscillatorType, gain: number) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = audio.currentTime + startOffset;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationSec);
  osc.connect(g).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + durationSec + 0.02);
}

export const sfx = {
  discover: () => beep(660, 0, 0.08, "square", 0.05),
  quote: () => beep(520, 0, 0.06, "triangle", 0.04),
  decline: () => beep(160, 0, 0.16, "sawtooth", 0.05),
  chosen: () => {
    beep(523, 0, 0.09, "square", 0.05);
    beep(659, 0.08, 0.12, "square", 0.05);
  },
  paid: () => {
    // a little coin-drop arpeggio
    beep(784, 0, 0.08, "square", 0.06);
    beep(988, 0.07, 0.08, "square", 0.06);
    beep(1318, 0.14, 0.16, "square", 0.06);
  },
  receipt: () => beep(880, 0, 0.05, "sine", 0.04),
  refused: () => beep(110, 0, 0.3, "sawtooth", 0.06),
  achievement: () => {
    beep(660, 0, 0.07, "triangle", 0.05);
    beep(880, 0.06, 0.07, "triangle", 0.05);
    beep(1046, 0.12, 0.14, "triangle", 0.05);
  },
};

export type SfxKey = keyof typeof sfx;
