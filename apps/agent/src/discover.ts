import { discoverProviders, type AgentRecord } from "@wayfare/identity";
import { providerDiscoveredEvent, type Emit } from "./events.js";

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
export async function discoverAndAssess(text: string, emit: Emit = () => {}): Promise<AssessResult> {
  const providers = await discoverProviders();
  const candidates: Candidate[] = [];
  const rejected: RejectedCandidate[] = [];

  for (const record of providers) {
    emit(providerDiscoveredEvent(record));
    const provider = labelOf(record);
    const webEndpoint = record.endpoints.web;
    if (!webEndpoint) {
      rejected.push({ provider, reason: "no agent-endpoint[web] set" });
      emit({ type: "quote_declined", provider, reason: "no agent-endpoint[web] set" });
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
        const reason = body.error ?? `quote failed (${res.status})`;
        rejected.push({ provider, reason });
        emit({ type: "quote_declined", provider, reason });
        continue;
      }
      candidates.push({
        provider,
        record,
        quoteId: body.quote_id,
        priceTinybars: body.price_tinybars,
        executePath: body.execute_path ?? "/v1/execute",
      });
      emit({ type: "quote_received", provider, priceTinybars: body.price_tinybars });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      rejected.push({ provider, reason });
      emit({ type: "quote_declined", provider, reason });
    }
  }

  return { candidates, rejected };
}
