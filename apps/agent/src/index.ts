import "dotenv/config";
import { x402Client } from "@x402/core/client";
import { decodePaymentResponseHeader } from "@x402/core/http";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { config, Budget } from "./config.js";
import { discoverAndAssess } from "./discover.js";
import { decide } from "./decide.js";

const DEFAULT_TEXT =
  "Wayfare is an agent that discovers services it has never seen before. " +
  "It pays for them per call on Hedera testnet via x402. " +
  "It leaves a verifiable receipt trail for every provider it deals with. " +
  "The agent doesn't know its own tools until it looks.";

async function main() {
  const text = process.argv.slice(2).join(" ") || DEFAULT_TEXT;
  const budget = new Budget(config.maxTotalTinybars, config.maxPricePerCallTinybars, config.maxCalls);

  console.log(`[agent] task: summarize ${text.length} chars`);
  console.log("[agent] DISCOVER: resolving providers under wayfare.eth via ENS event logs ...");
  const { candidates, rejected } = await discoverAndAssess(text);

  console.log(`[agent] ASSESS: ${candidates.length} provider(s) quoted, ${rejected.length} declined`);
  for (const c of candidates) console.log(`  - ${c.provider}: ${c.priceTinybars} tinybars`);
  for (const r of rejected) console.log(`  - ${r.provider}: declined — ${r.reason}`);

  console.log("[agent] DECIDE:");
  const { chosen, reasoning } = decide(candidates, config.maxPricePerCallTinybars, budget.remainingTinybars);
  for (const line of reasoning) console.log(`  ${line}`);

  if (!chosen) {
    console.log("[agent] no provider chosen — stopping without paying anything");
    return;
  }

  budget.assertCanSpend(chosen.priceTinybars);

  const signer = createClientHederaSigner(config.payerAccountId, PrivateKey.fromStringECDSA(config.payerPrivateKey), {
    network: "hedera:testnet",
  });
  const client = x402Client.fromConfig({
    schemes: [{ network: "hedera:*", client: new ExactHederaScheme(signer) }],
    spendControls: {
      allowedAssets: [{ network: "hedera:testnet", asset: "0.0.0", maxAmountPerPayment: String(config.maxPricePerCallTinybars) }],
    },
  });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  console.log(`[agent] PAY: settling with ${chosen.provider} via x402/Blocky402 ...`);
  const execRes = await fetchWithPayment(`${chosen.record.endpoints.web}${chosen.executePath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_id: chosen.quoteId, text }),
  });

  if (!execRes.ok) {
    throw new Error(`execute failed: ${execRes.status} ${await execRes.text()}`);
  }

  const result = await execRes.json();
  budget.recordSpend(chosen.priceTinybars);

  const paymentResponseHeader = execRes.headers.get("PAYMENT-RESPONSE") ?? execRes.headers.get("payment-response");
  const settlement = paymentResponseHeader ? decodePaymentResponseHeader(paymentResponseHeader) : undefined;

  console.log("[agent] CONSUME:", result);
  console.log(
    `[agent] spent ${chosen.priceTinybars} tinybars (${budget.totalSpentTinybars}/${config.maxTotalTinybars} total, ` +
      `${budget.callsMade}/${config.maxCalls} calls)`,
  );

  if (settlement?.transaction) {
    console.log(`[agent] settlement tx: ${settlement.transaction}`);
    console.log(`[agent] HashScan: https://hashscan.io/testnet/transaction/${settlement.transaction}`);
  } else {
    console.warn("[agent] no PAYMENT-RESPONSE header in the response — could not resolve a HashScan link");
  }
}

main().catch((err) => {
  console.error("[agent] fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
