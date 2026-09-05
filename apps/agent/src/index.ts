import "dotenv/config";
import { x402Client } from "@x402/core/client";
import { decodePaymentResponseHeader } from "@x402/core/http";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { config, Budget } from "./config.js";

interface Quote {
  quote_id: string;
  price_tinybars: number;
  asset: string;
  network: string;
  expires_at: string;
}

const DEFAULT_TEXT =
  "Wayfare is an agent that discovers services it has never seen before. " +
  "It pays for them per call on Hedera testnet via x402. " +
  "It leaves a verifiable receipt trail for every provider it deals with. " +
  "This is milestone one: a single paid call, hardcoded to one provider.";

async function main() {
  const text = process.argv.slice(2).join(" ") || DEFAULT_TEXT;
  const budget = new Budget(config.maxTotalTinybars, config.maxPricePerCallTinybars, config.maxCalls);

  console.log(`[agent] M1: one paid call to ${config.m1ProviderUrl}`);
  console.log(`[agent] task: summarize ${text.length} chars`);

  const quoteRes = await fetch(`${config.m1ProviderUrl}/v1/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_spec: { char_count: text.length } }),
  });
  if (!quoteRes.ok) {
    throw new Error(`quote failed: ${quoteRes.status} ${await quoteRes.text()}`);
  }
  const quote = (await quoteRes.json()) as Quote;
  console.log(
    `[agent] quote ${quote.quote_id}: ${quote.price_tinybars} tinybars, expires ${quote.expires_at}`,
  );

  budget.assertCanSpend(quote.price_tinybars);

  const signer = createClientHederaSigner(config.payerAccountId, PrivateKey.fromStringECDSA(config.payerPrivateKey), {
    network: "hedera:testnet",
  });
  const client = x402Client.fromConfig({
    schemes: [{ network: "hedera:*", client: new ExactHederaScheme(signer) }],
    spendControls: {
      // Our own Budget guardrails (MAX_TOTAL_TINYBARS / MAX_PRICE_PER_CALL_TINYBARS / MAX_CALLS)
      // already enforce the actual numeric limits above, before this client is ever asked to pay.
      // This just scopes the SDK's own default $1-cap USD spend control to the one asset we expect.
      allowedAssets: [{ network: "hedera:testnet", asset: "0.0.0", maxAmountPerPayment: String(config.maxPricePerCallTinybars) }],
    },
  });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  console.log("[agent] paying via x402/Blocky402 and calling /v1/execute ...");
  const execRes = await fetchWithPayment(`${config.m1ProviderUrl}/v1/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_id: quote.quote_id, text }),
  });

  if (!execRes.ok) {
    throw new Error(`execute failed: ${execRes.status} ${await execRes.text()}`);
  }

  const result = await execRes.json();
  budget.recordSpend(quote.price_tinybars);

  const paymentResponseHeader = execRes.headers.get("PAYMENT-RESPONSE") ?? execRes.headers.get("payment-response");
  const settlement = paymentResponseHeader ? decodePaymentResponseHeader(paymentResponseHeader) : undefined;

  console.log("[agent] result:", result);
  console.log(
    `[agent] spent ${quote.price_tinybars} tinybars (${budget.totalSpentTinybars}/${config.maxTotalTinybars} total, ` +
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
