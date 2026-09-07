import { discoverProviders, type AgentRecord } from "@wayfare/identity";

export interface Candidate {
  provider: string; // label, e.g. "deep"
  record: AgentRecord;
  quoteId: string;
  priceTinybars: number;
  executePath: string;
}

interface RejectedCandidate {
  provider: string;
  reason: string;
}

export interface AssessResult {
  candidates: Candidate[];
  rejected: RejectedCandidate[];
}

function labelOf(record: AgentRecord): string {
  return record.name.split(".")[0] ?? record.name;
}

/**
 * DISCOVER (real ENS event-log discovery, see packages/identity) + ASSESS (ask every
 * discovered provider for a quote on this exact task; a provider outside its domain, like
 * niche on prose text, rejects here — before any payment, never guessed around).
 */
export async function discoverAndAssess(text: string): Promise<AssessResult> {
  const providers = await discoverProviders();
  const candidates: Candidate[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const record of providers) {
    const provider = labelOf(record);
    const webEndpoint = record.endpoints.web;
    if (!webEndpoint) {
      rejected.push({ provider, reason: "no agent-endpoint[web] set" });
      continue;
    }

    try {
      const res = await fetch(`${webEndpoint}/v1/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, input_spec: { char_count: text.length } }),
      });
      const body = (await res.json()) as {
        quote_id?: string;
        price_tinybars?: number;
        execute_path?: string;
        error?: string;
      };
      if (!res.ok || !body.quote_id || typeof body.price_tinybars !== "number") {
        rejected.push({ provider, reason: body.error ?? `quote failed (${res.status})` });
        continue;
      }
      candidates.push({
        provider,
        record,
        quoteId: body.quote_id,
        priceTinybars: body.price_tinybars,
        executePath: body.execute_path ?? "/v1/execute",
      });
    } catch (err) {
      rejected.push({ provider, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  return { candidates, rejected };
}
