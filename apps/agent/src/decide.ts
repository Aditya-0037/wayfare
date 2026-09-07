import type { Candidate } from "./discover.js";

// Relative quality, not price — used only to break ties among candidates that are all
// affordable. Keyed by provider label because that's how the task domain (text
// summarization) happens to differentiate quality in this project; it says nothing about
// where to reach them (that's discovered, never hardcoded).
const QUALITY_RANK: Record<string, number> = { deep: 3, niche: 2, swift: 1 };

export interface Decision {
  chosen: Candidate | null;
  reasoning: string[];
}

/**
 * DECIDE: among providers that actually quoted this task, keep the ones affordable under
 * both the per-call ceiling and the remaining run budget, then prefer the highest-quality
 * one. Every step is logged so the choice is auditable, not just asserted.
 */
export function decide(
  candidates: Candidate[],
  maxPricePerCallTinybars: number,
  remainingBudgetTinybars: number,
): Decision {
  const reasoning: string[] = [];
  reasoning.push(`${candidates.length} provider(s) quoted this task: ${candidates.map((c) => `${c.provider}=${c.priceTinybars}`).join(", ") || "(none)"}`);

  const affordable = candidates.filter((c) => {
    const fitsPerCall = c.priceTinybars <= maxPricePerCallTinybars;
    const fitsBudget = c.priceTinybars <= remainingBudgetTinybars;
    if (!fitsPerCall) reasoning.push(`${c.provider}: ${c.priceTinybars} exceeds MAX_PRICE_PER_CALL_TINYBARS (${maxPricePerCallTinybars}), dropped`);
    else if (!fitsBudget) reasoning.push(`${c.provider}: ${c.priceTinybars} exceeds remaining budget (${remainingBudgetTinybars}), dropped`);
    return fitsPerCall && fitsBudget;
  });

  if (affordable.length === 0) {
    reasoning.push("no affordable candidate — refusing to pay");
    return { chosen: null, reasoning };
  }

  const ranked = [...affordable].sort((a, b) => {
    const qualityDiff = (QUALITY_RANK[b.provider] ?? 0) - (QUALITY_RANK[a.provider] ?? 0);
    return qualityDiff !== 0 ? qualityDiff : a.priceTinybars - b.priceTinybars;
  });

  const chosen = ranked[0];
  reasoning.push(
    `chose ${chosen.provider} (${chosen.priceTinybars} tinybars) — highest quality affordable ` +
      `among [${affordable.map((c) => c.provider).join(", ")}]`,
  );
  return { chosen, reasoning };
}
