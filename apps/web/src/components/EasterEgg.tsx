import { useEffect, useState } from "react";
import Confetti, { makeParticles, type ConfettiParticle } from "./Confetti";

const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const EMOJI = ["🐢", "🚀", "🧭", "💰", "📜", "🛰️", "🪙"];

// Purely cosmetic — the classic Konami code triggers a burst of emoji confetti and a wink
// at the project's own pitch. Nothing here touches agent state, budgets, or the event log.
export default function EasterEgg() {
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

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
      setParticles(makeParticles(EMOJI, 28));
      setTimeout(() => setActive(false), 3200);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return <Confetti active={active} particles={particles} caption="no cheat codes for the treasury — the agent still checks its own budget" />;
}
