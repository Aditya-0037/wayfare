import type { AgentRecord } from "@wayfare/identity";

// The WebSocket event contract for the frontend (M7). Server-authoritative: every field here
// is computed by the agent, never by a browser — the frontend only renders what arrives.
export type AgentEvent =
  | { type: "run_started"; text: string; maxTotalTinybars: number; maxPricePerCallTinybars: number; maxCalls: number }
  | { type: "provider_discovered"; provider: string; name: string; agentContext: string; endpoints: Record<string, string> }
  | { type: "quote_received"; provider: string; priceTinybars: number }
  | { type: "quote_declined"; provider: string; reason: string }
  | { type: "decision_made"; chosen: string | null; reasoning: string[] }
  | { type: "payment_settled"; provider: string; priceTinybars: number; transaction: string; hashscanUrl: string }
  | { type: "result_delivered"; provider: string; result: unknown }
  | { type: "receipt_recorded"; topicId: string; sequenceNumber: string; mirrorNodeUrl: string }
  | { type: "reputation_updated"; provider: string; completed_calls: number; disputes: number; mean_latency_ms: number | null }
  | { type: "budget_updated"; totalSpentTinybars: number; maxTotalTinybars: number; callsMade: number; maxCalls: number; remainingTinybars: number }
  | { type: "run_refused"; reason: string }
  | { type: "run_complete"; success: boolean };

export type Emit = (event: AgentEvent) => void;

export function providerDiscoveredEvent(record: AgentRecord): AgentEvent {
  return {
    type: "provider_discovered",
    provider: record.name.split(".")[0] ?? record.name,
    name: record.name,
    agentContext: record.agentContext,
    endpoints: record.endpoints,
  };
}
