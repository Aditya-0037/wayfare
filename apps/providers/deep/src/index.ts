import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import { x402ResourceServer, HTTPFacilitatorClient, type RoutesConfig } from "@x402/core/server";
import { paymentMiddleware } from "@x402/express";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { deepSummary } from "./summarize.js";

const PORT = Number(process.env.PORT ?? 4002);
const MERCHANT_ACCOUNT_ID = process.env.HEDERA_MERCHANT_ACCOUNT_ID;
const FACILITATOR_URL = process.env.BLOCKY402_FACILITATOR_URL ?? "https://api.testnet.blocky402.com";
const BASE_PRICE_TINYBARS = Number(process.env.BASE_PRICE_TINYBARS ?? 300_000);
const PER_UNIT_PRICE_TINYBARS = Number(process.env.PER_UNIT_PRICE_TINYBARS ?? 200);
const PROVIDER_ENS_NAME = process.env.PROVIDER_ENS_NAME ?? "deep.wayfare.eth";
const ASSET_HBAR = "0.0.0";
const NETWORK = "hedera:testnet";
const QUOTE_TTL_MS = 5 * 60 * 1000;

if (!MERCHANT_ACCOUNT_ID) {
  throw new Error("HEDERA_MERCHANT_ACCOUNT_ID is required (the account that receives payment for deep)");
}

// Metered by input size, but x402 payment gating on this SDK only supports a static price per
// registered route, so metering is bucketed into three tiers rather than priced per exact
// character — same idea real metered APIs use (small/medium/large request pricing).
type Bucket = "small" | "medium" | "large";

function bucketFor(charCount: number): Bucket {
  if (charCount <= 500) return "small";
  if (charCount <= 2000) return "medium";
  return "large";
}

const BUCKET_REPRESENTATIVE_CHARS: Record<Bucket, number> = { small: 500, medium: 2000, large: 6000 };

function priceForBucket(bucket: Bucket): number {
  return BASE_PRICE_TINYBARS + PER_UNIT_PRICE_TINYBARS * BUCKET_REPRESENTATIVE_CHARS[bucket];
}

interface StoredQuote {
  charCount: number;
  bucket: Bucket;
  priceTinybars: number;
  expiresAt: number;
}

const quotes = new Map<string, StoredQuote>();

const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
const resourceServer = new x402ResourceServer(facilitatorClient).register(
  "hedera:*",
  new ExactHederaScheme({
    defaultAssets: {
      "hedera:testnet": { asset: ASSET_HBAR, decimals: 8 },
    },
  }),
);

const buckets: Bucket[] = ["small", "medium", "large"];
const routes: RoutesConfig = Object.fromEntries(
  buckets.map((bucket) => [
    `POST /v1/execute/${bucket}`,
    {
      accepts: {
        scheme: "exact",
        network: NETWORK,
        payTo: MERCHANT_ACCOUNT_ID,
        price: { asset: ASSET_HBAR, amount: String(priceForBucket(bucket)) },
        maxTimeoutSeconds: 300,
      },
      description: `deep: thorough frequency-ranked summary (${bucket} input, metered)`,
      mimeType: "application/json",
    },
  ]),
);

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    provider: "deep",
    trait: "thorough result — expensive, higher quality",
    task: "text-summarization",
    method: "frequency-ranked-extraction",
    pricing: {
      model: "metered",
      base_tinybars: BASE_PRICE_TINYBARS,
      per_char_tinybars: PER_UNIT_PRICE_TINYBARS,
      asset: ASSET_HBAR,
      network: NETWORK,
    },
  });
});

app.get("/.well-known/agent-card", (_req, res) => {
  res.json({
    name: "deep",
    ensName: PROVIDER_ENS_NAME,
    description:
      "Thorough text summarizer. Scores every sentence by document-wide word frequency and keeps " +
      "the top-ranked ~30% in original order. Higher quality than swift, priced by input size.",
    task: "text-summarization",
    trait: "expensive, higher quality, metered",
    pricing: {
      model: "metered",
      base_tinybars: BASE_PRICE_TINYBARS,
      per_char_tinybars: PER_UNIT_PRICE_TINYBARS,
      asset: ASSET_HBAR,
      network: NETWORK,
    },
    endpoints: {
      quote: "/v1/quote",
      execute: "/v1/execute/<bucket returned by quote>",
    },
    protocol: "x402/hedera",
  });
});

app.post("/v1/quote", (req, res) => {
  const charCount = Number(req.body?.input_spec?.char_count ?? req.body?.text?.length ?? 0);
  if (!charCount || charCount <= 0) {
    res.status(400).json({ error: "input_spec.char_count (or text) is required" });
    return;
  }
  const bucket = bucketFor(charCount);
  const quoteId = randomUUID();
  const priceTinybars = priceForBucket(bucket);
  const expiresAt = Date.now() + QUOTE_TTL_MS;
  quotes.set(quoteId, { charCount, bucket, priceTinybars, expiresAt });
  res.json({
    quote_id: quoteId,
    price_tinybars: priceTinybars,
    bucket,
    execute_path: `/v1/execute/${bucket}`,
    asset: ASSET_HBAR,
    network: NETWORK,
    expires_at: new Date(expiresAt).toISOString(),
  });
});

app.use(paymentMiddleware(routes, resourceServer));

function handleExecute(bucket: Bucket) {
  return (req: express.Request, res: express.Response) => {
    const { quote_id: quoteId, text } = req.body ?? {};
    if (typeof text !== "string" || !text.trim()) {
      res.status(400).json({ error: "text is required" });
      return;
    }
    const quote = quoteId ? quotes.get(quoteId) : undefined;
    if (!quote) {
      res.status(400).json({ error: "unknown or missing quote_id — call /v1/quote first" });
      return;
    }
    if (quote.bucket !== bucket) {
      res.status(400).json({ error: `this quote is for the ${quote.bucket} bucket, not ${bucket}` });
      return;
    }
    if (quote.expiresAt < Date.now()) {
      quotes.delete(quoteId);
      res.status(400).json({ error: "quote expired" });
      return;
    }
    quotes.delete(quoteId);

    const summary = deepSummary(text);
    res.json({
      provider: "deep",
      method: "frequency-ranked-extraction",
      summary,
    });
  };
}

for (const bucket of buckets) {
  app.post(`/v1/execute/${bucket}`, handleExecute(bucket));
}

app.listen(PORT, () => {
  console.log(`[deep] listening on http://localhost:${PORT}`);
  console.log(`[deep] merchant account: ${MERCHANT_ACCOUNT_ID}`);
  console.log(`[deep] facilitator: ${FACILITATOR_URL}`);
});
