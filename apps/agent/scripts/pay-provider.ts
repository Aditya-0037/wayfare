import "dotenv/config";
import { readFileSync } from "node:fs";
import { x402Client } from "@x402/core/client";
import { decodePaymentResponseHeader } from "@x402/core/http";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createClientHederaSigner, PrivateKey } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { config } from "../src/config.js";

// One-off manual test tool for paying an arbitrary provider directly, ahead of M3's real
// discovery-driven loop. Not the agent's main entrypoint (see src/index.ts).
// Multi-line text doesn't survive shell quoting reliably on Windows, so a leading "@"
// reads the text from a file instead (e.g. `@scratch/list.txt`).
const baseUrl = process.argv[2];
const rawText = process.argv.slice(3).join(" ");
if (!baseUrl || !rawText) {
  console.error('usage: tsx scripts/pay-provider.ts <baseUrl> "<text>" | @path/to/file.txt');
  process.exit(1);
}
const text = rawText.startsWith("@") ? readFileSync(rawText.slice(1), "utf8") : rawText;

async function main() {
  const quoteRes = await fetch(`${baseUrl}/v1/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, input_spec: { char_count: text.length } }),
  });
  const quote = (await quoteRes.json()) as { quote_id: string; execute_path?: string; [key: string]: unknown };
  if (!quoteRes.ok) {
    console.log("quote rejected:", quote);
    return;
  }
  console.log("quote:", quote);

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

  const executePath = quote.execute_path ?? "/v1/execute";
  const execRes = await fetchWithPayment(`${baseUrl}${executePath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_id: quote.quote_id, text }),
  });
  const result = await execRes.json();
  console.log("result:", result);

  const header = execRes.headers.get("PAYMENT-RESPONSE") ?? execRes.headers.get("payment-response");
  const settlement = header ? decodePaymentResponseHeader(header) : undefined;
  if (settlement?.transaction) {
    console.log("HashScan:", `https://hashscan.io/testnet/transaction/${settlement.transaction}`);
  }
}

main().catch((err) => {
  console.error("fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
