import type { AgentEvent } from "./types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Pure check against the accumulated real event log — no synthetic state of its own. */
  check: (log: AgentEvent[]) => boolean;
}

function count<T extends AgentEvent["type"]>(log: AgentEvent[], type: T): number {
  return log.filter((e) => e.type === type).length;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-contact",
    title: "First Contact",
    description: "Discovered a provider over ENS for the first time — no config file, just event logs.",
    icon: "📡",
    check: (log) => count(log, "provider_discovered") >= 1,
  },
  {
    id: "window-shopper",
    title: "Window Shopper",
    description: "Got responses (quoted or declined) from all three providers in one run.",
    icon: "🛍️",
    check: (log) => {
      let started = -1;
      for (let i = log.length - 1; i >= 0; i--) {
        if (log[i].type === "run_started") {
          started = i;
          break;
        }
      }
      const slice = started >= 0 ? log.slice(started) : log;
      const responded = new Set(
        slice.filter((e) => e.type === "quote_received" || e.type === "quote_declined").map((e) => (e as { provider: string }).provider),
      );
      return responded.size >= 3;
    },
  },
  {
    id: "gatekept",
    title: "Gatekept",
    description: "Watched niche reject a task at quote time — before a single tinybar moved.",
    icon: "🚫",
    check: (log) => count(log, "quote_declined") >= 1,
  },
  {
    id: "money-where-mouth-is",
    title: "Money Where Mouth Is",
    description: "A real payment settled on Hedera testnet via x402.",
    icon: "💸",
    check: (log) => count(log, "payment_settled") >= 1,
  },
  {
    id: "paper-trail",
    title: "Paper Trail",
    description: "A settlement receipt got anchored to Hedera Consensus Service.",
    icon: "🧾",
    check: (log) => count(log, "receipt_recorded") >= 1,
  },
  {
    id: "penny-pincher",
    title: "Penny Pincher",
    description: "A tight budget forced the agent to pick swift over the fancier options.",
    icon: "🪙",
    check: (log) => log.some((e) => e.type === "decision_made" && e.chosen === "swift"),
  },
  {
    id: "budget-ninja",
    title: "Budget Ninja",
    description: "Watched the agent refuse to spend rather than break its own guardrails.",
    icon: "🥷",
    check: (log) => count(log, "run_refused") >= 1,
  },
  {
    id: "regular",
    title: "Regular",
    description: "One provider's on-chain reputation record has now seen 5+ completed calls.",
    icon: "⭐",
    check: (log) => log.some((e) => e.type === "reputation_updated" && e.completed_calls >= 5),
  },
];

const STORAGE_KEY = "wayfare_achievements_v1";

export function loadUnlocked(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function saveUnlocked(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // best-effort only — a private/blocked storage context just means badges don't persist
  }
}
