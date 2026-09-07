// Mirrors apps/agent/src/events.ts — the WebSocket contract. Server-authoritative:
// every field here is computed by the agent, never by the browser.
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

export interface ProviderState {
  provider: string;
  name: string;
  agentContext: string;
  endpoints: Record<string, string>;
  quotePriceTinybars?: number;
  declinedReason?: string;
  status: "discovered" | "quoted" | "declined" | "chosen" | "paid";
  reputation?: { completed_calls: number; disputes: number; mean_latency_ms: number | null };
}

export interface LedgerEntry {
  id: string;
  kind: "payment" | "receipt" | "budget" | "refused";
  label: string;
  detail: string;
  href?: string;
  timestamp: number;
}
