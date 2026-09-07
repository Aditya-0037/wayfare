import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import { x402ResourceServer, HTTPFacilitatorClient, type RoutesConfig } from "@x402/core/server";
import { paymentMiddleware } from "@x402/express";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { extractListItems, NotStructuredError } from "./extract.js";

const PORT = Number(process.env.PORT ?? 4003);
const MERCHANT_ACCOUNT_ID = process.env.HEDERA_MERCHANT_ACCOUNT_ID;
const FACILITATOR_URL = process.env.BLOCKY402_FACILITATOR_URL ?? "https://api.testnet.blocky402.com";
const BASE_PRICE_TINYBARS = Number(process.env.BASE_PRICE_TINYBARS ?? 150_000);
const PROVIDER_ENS_NAME = process.env.PROVIDER_ENS_NAME ?? "niche.wayfare.eth";
const ASSET_HBAR = "0.0.0";
const NETWORK = "hedera:testnet";
const QUOTE_TTL_MS = 5 * 60 * 1000;

if (!MERCHANT_ACCOUNT_ID) {
  throw new Error("HEDERA_MERCHANT_ACCOUNT_ID is required (the account that receives payment for niche)");
}

interface StoredQuote {
  text: string;
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
    description: "niche: flattens a markdown-style list into a summary (flat fee)",
    mimeType: "application/json",
  },
};

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    provider: "niche",
    message: "This is an x402-gated API, not a website — there's nothing to render at /.",
    try: ["/health", "/.well-known/agent-card"],
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    provider: "niche",
    trait: "only handles markdown-style lists — fails loudly outside that domain",
    task: "text-summarization",
    method: "list-item-extraction",
    pricing: { model: "flat", base_tinybars: BASE_PRICE_TINYBARS, asset: ASSET_HBAR, network: NETWORK },
  });
});

app.get("/.well-known/agent-card", (_req, res) => {
  res.json({
    name: "niche",
    ensName: PROVIDER_ENS_NAME,
    description:
      "Only summarizes markdown-style lists (bullet or numbered lines) by flattening them into " +
      "a clean summary. Rejects anything else at quote time — no charge for input outside its domain.",
    task: "text-summarization",
    trait: "narrow domain, fails loudly, mid-priced",
    pricing: { model: "flat", base_tinybars: BASE_PRICE_TINYBARS, asset: ASSET_HBAR, network: NETWORK },
    endpoints: {
      quote: "/v1/quote",
      execute: "/v1/execute",
    },
    protocol: "x402/hedera",
  });
});

app.post("/v1/quote", (req, res) => {
  const text = req.body?.text;
  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  try {
    extractListItems(text);
  } catch (err) {
    if (err instanceof NotStructuredError) {
      res.status(422).json({ error: err.message });
      return;
    }
    throw err;
  }

  const quoteId = randomUUID();
  const priceTinybars = BASE_PRICE_TINYBARS;
  const expiresAt = Date.now() + QUOTE_TTL_MS;
  quotes.set(quoteId, { text, priceTinybars, expiresAt });
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
  const { quote_id: quoteId } = req.body ?? {};
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

  try {
    const items = extractListItems(quote.text);
    res.json({
      provider: "niche",
      method: "list-item-extraction",
      summary: items.join("; "),
      item_count: items.length,
    });
  } catch (err) {
    if (err instanceof NotStructuredError) {
      res.status(422).json({ error: err.message });
      return;
    }
    throw err;
  }
});

app.listen(PORT, () => {
  console.log(`[niche] listening on http://localhost:${PORT}`);
  console.log(`[niche] merchant account: ${MERCHANT_ACCOUNT_ID}`);
  console.log(`[niche] facilitator: ${FACILITATOR_URL}`);
});
