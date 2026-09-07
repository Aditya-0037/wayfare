import { motion } from "framer-motion";

// A playful isometric "compass rig" — three orbiting rings around a paid-call core,
// standing in for the agent choosing between providers. Pure CSS 3D, no model assets.
export default function CompassRig() {
  return (
    <div className="relative mx-auto h-[320px] w-[320px] [perspective:1400px] sm:h-[380px] sm:w-[380px]">
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotateY: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        style={{ rotateX: 58 }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border"
            style={{
              borderColor: ["rgba(125,255,179,0.45)", "rgba(125,184,255,0.4)", "rgba(255,179,125,0.35)"][i],
              transform: `rotateX(90deg) scale(${1 - i * 0.22})`,
              boxShadow: `0 0 40px -6px ${["rgba(125,255,179,0.25)", "rgba(125,184,255,0.2)", "rgba(255,179,125,0.18)"][i]}`,
            }}
          />
        ))}
      </motion.div>

      {/* orbiting provider markers */}
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-signal shadow-glow" />
      </motion.div>
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotate: -360 }}
        transition={{ duration: 19, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute right-6 top-1/3 h-2 w-2 rounded-full bg-signal2 shadow-glow2" />
      </motion.div>
      <motion.div
        className="absolute inset-0 [transform-style:preserve-3d]"
        animate={{ rotate: 360 }}
        transition={{ duration: 23, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute bottom-8 left-8 h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_20px_2px_rgba(255,179,125,0.5)]" />
      </motion.div>

      {/* core */}
      <motion.div
        className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl border border-edge/10 bg-gradient-to-br from-panel to-ink shadow-card [transform-style:preserve-3d]"
        animate={{ rotateY: [0, 12, 0, -12, 0], rotateX: [0, -6, 0, 6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-4xl">🧭</span>
      </motion.div>
    </div>
  );
}
