import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import { x402ResourceServer, HTTPFacilitatorClient, type RoutesConfig } from "@x402/core/server";
import { paymentMiddleware } from "@x402/express";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { leadSummary } from "./summarize.js";

const PORT = Number(process.env.PORT ?? 4001);
const MERCHANT_ACCOUNT_ID = process.env.HEDERA_MERCHANT_ACCOUNT_ID;
const FACILITATOR_URL = process.env.BLOCKY402_FACILITATOR_URL ?? "https://api.testnet.blocky402.com";
const BASE_PRICE_TINYBARS = Number(process.env.BASE_PRICE_TINYBARS ?? 100_000);
const PROVIDER_ENS_NAME = process.env.PROVIDER_ENS_NAME ?? "swift.wayfare.eth";
const ASSET_HBAR = "0.0.0";
const NETWORK = "hedera:testnet";
const QUOTE_TTL_MS = 5 * 60 * 1000;

if (!MERCHANT_ACCOUNT_ID) {
  throw new Error("HEDERA_MERCHANT_ACCOUNT_ID is required (the account that receives payment for swift)");
}

interface StoredQuote {
  charCount: number;
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

const routes: RoutesConfig = {
  "POST /v1/execute": {
    accepts: {
      scheme: "exact",
      network: NETWORK,
      payTo: MERCHANT_ACCOUNT_ID,
      price: { asset: ASSET_HBAR, amount: String(BASE_PRICE_TINYBARS) },
      maxTimeoutSeconds: 300,
    },
    description: "swift: fast lead-sentence text summary (flat fee)",
    mimeType: "application/json",
  },
};

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    provider: "swift",
    message: "This is an x402-gated API, not a website — there's nothing to render at /.",
    try: ["/health", "/.well-known/agent-card"],
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    provider: "swift",
    trait: "fast, shallow result — cheap, lower quality",
    task: "text-summarization",
    method: "lead-sentence-extraction",
    pricing: { model: "flat", base_tinybars: BASE_PRICE_TINYBARS, asset: ASSET_HBAR, network: NETWORK },
  });
});

app.get("/.well-known/agent-card", (_req, res) => {
  res.json({
    name: "swift",
    ensName: PROVIDER_ENS_NAME,
    description:
      "Fast, shallow text summarizer. Returns the first two sentences of the input verbatim. " +
      "Cheap flat fee, lower quality than deep. Good for a quick gist, not for nuance.",
    task: "text-summarization",
    trait: "cheap, low-latency, shallow",
    pricing: { model: "flat", base_tinybars: BASE_PRICE_TINYBARS, asset: ASSET_HBAR, network: NETWORK },
    endpoints: {
      quote: "/v1/quote",
      execute: "/v1/execute",
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
  const quoteId = randomUUID();
  const priceTinybars = BASE_PRICE_TINYBARS; // flat fee regardless of size
  const expiresAt = Date.now() + QUOTE_TTL_MS;
  quotes.set(quoteId, { charCount, priceTinybars, expiresAt });
  res.json({
    quote_id: quoteId,
    price_tinybars: priceTinybars,
    asset: ASSET_HBAR,
    network: NETWORK,
    expires_at: new Date(expiresAt).toISOString(),
  });
});

app.use(paymentMiddleware(routes, resourceServer));

app.post("/v1/execute", (req, res) => {
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
  if (quote.expiresAt < Date.now()) {
    quotes.delete(quoteId);
    res.status(400).json({ error: "quote expired" });
    return;
  }
  quotes.delete(quoteId);

  const summary = leadSummary(text, 2);
  res.json({
    provider: "swift",
    method: "lead-sentence-extraction",
    summary,
  });
});

app.listen(PORT, () => {
  console.log(`[swift] listening on http://localhost:${PORT}`);
  console.log(`[swift] merchant account: ${MERCHANT_ACCOUNT_ID}`);
  console.log(`[swift] facilitator: ${FACILITATOR_URL}`);
});
