import "dotenv/config";
import { runAgent } from "./runAgent.js";
import type { AgentEvent } from "./events.js";

const DEFAULT_TEXT =
  "Wayfare is an agent that discovers services it has never seen before. " +
  "It pays for them per call on Hedera testnet via x402. " +
  "It leaves a verifiable receipt trail for every provider it deals with. " +
  "The agent doesn't know its own tools until it looks.";

function log(event: AgentEvent) {
  switch (event.type) {
    case "run_started":
      console.log(`[agent] task: summarize ${event.text.length} chars`);
      console.log("[agent] DISCOVER: resolving providers under wayfare.eth via ENS event logs ...");
      break;
    case "provider_discovered":
      console.log(`[agent] discovered ${event.name}`);
      break;
    case "quote_received":
      console.log(`  - ${event.provider}: ${event.priceTinybars} tinybars`);
      break;
    case "quote_declined":
      console.log(`  - ${event.provider}: declined — ${event.reason}`);
      break;
    case "decision_made":
      console.log("[agent] DECIDE:");
      for (const line of event.reasoning) console.log(`  ${line}`);
      break;
    case "run_refused":
      console.log(`[agent] refused: ${event.reason}`);
      break;
    case "payment_settled":
      console.log(`[agent] PAY: settled with ${event.provider} for ${event.priceTinybars} tinybars`);
      console.log(`[agent] HashScan: ${event.hashscanUrl}`);
      break;
    case "result_delivered":
      console.log("[agent] CONSUME:", event.result);
      break;
    case "budget_updated":
      console.log(
        `[agent] spent ${event.totalSpentTinybars}/${event.maxTotalTinybars} total, ${event.callsMade}/${event.maxCalls} calls`,
      );
      break;
    case "receipt_recorded":
      console.log(`[agent] RECORD: receipt at topic ${event.topicId}, sequence #${event.sequenceNumber}`);
      console.log(`[agent] Mirror Node: ${event.mirrorNodeUrl}`);
      break;
    case "reputation_updated":
      console.log(
        `[agent] reputation for ${event.provider}: ${event.completed_calls} completed calls, ` +
          `mean latency ${event.mean_latency_ms}ms`,
      );
      break;
    case "run_complete":
      console.log(event.success ? "[agent] done." : "[agent] run ended without paying anything.");
      break;
  }
}

async function main() {
  const text = process.argv.slice(2).join(" ") || DEFAULT_TEXT;
  await runAgent(text, log);
}

main().catch((err) => {
  console.error("[agent] fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
