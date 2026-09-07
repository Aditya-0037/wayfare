import { x402Client } from "@x402/core/client";
import { decodePaymentResponseHeader } from "@x402/core/http";
import { wrapFetchWithPayment } from "@x402/fetch";
import { AccountBalanceQuery, AccountId, Client, createClientHederaSigner, PrivateKey } from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { hashResult, recordReceipt } from "@wayfare/receipts";
import { updateReputation } from "@wayfare/identity";
import { config, Budget } from "./config.js";
import { discoverAndAssess } from "./discover.js";
import { decide } from "./decide.js";
import type { Emit } from "./events.js";

export interface RunResult {
  success: boolean;
  provider?: string;
  transaction?: string;
}

/**
 * The full DISCOVER -> ASSESS -> DECIDE -> PAY -> CONSUME -> RECORD loop, emitting a typed
 * event at every step. This is the one place the logic lives — the CLI entrypoint
 * (src/index.ts) and the WebSocket server (src/server.ts) both just supply an `emit` and
 * print/broadcast whatever comes out.
 */
export async function runAgent(text: string, emit: Emit): Promise<RunResult> {
  const budget = new Budget(config.maxTotalTinybars, config.maxPricePerCallTinybars, config.maxCalls);
  emit({
    type: "run_started",
    text,
    maxTotalTinybars: config.maxTotalTinybars,
    maxPricePerCallTinybars: config.maxPricePerCallTinybars,
    maxCalls: config.maxCalls,
  });

  const { candidates } = await discoverAndAssess(text, emit);

  const { chosen, reasoning } = decide(candidates, config.maxPricePerCallTinybars, budget.remainingTinybars);
  emit({ type: "decision_made", chosen: chosen?.provider ?? null, reasoning });

  if (!chosen) {
    emit({ type: "run_refused", reason: reasoning[reasoning.length - 1] ?? "no affordable candidate" });
    emit({ type: "run_complete", success: false });
    return { success: false };
  }

  try {
    budget.assertCanSpend(chosen.priceTinybars);

    const balanceCheckClient = Client.forTestnet().setOperator(
      AccountId.fromString(config.payerAccountId),
      PrivateKey.fromStringECDSA(config.payerPrivateKey),
    );
    const balance = await new AccountBalanceQuery().setAccountId(config.payerAccountId).execute(balanceCheckClient);
    balanceCheckClient.close();
    budget.assertBalanceFloor(balance.hbars.toTinybars().toNumber(), chosen.priceTinybars, config.balanceFloorTinybars);
  } catch (err) {
    emit({ type: "run_refused", reason: err instanceof Error ? err.message : String(err) });
    emit({ type: "run_complete", success: false });
    return { success: false };
  }

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

  const callStartedAt = Date.now();
  const execRes = await fetchWithPayment(`${chosen.record.endpoints.web}${chosen.executePath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote_id: chosen.quoteId, text }),
  });
  const latencyMs = Date.now() - callStartedAt;

  if (!execRes.ok) {
    emit({ type: "run_refused", reason: `execute failed: ${execRes.status} ${await execRes.text()}` });
    emit({ type: "run_complete", success: false });
    return { success: false };
  }

  const result = await execRes.json();
  budget.recordSpend(chosen.priceTinybars);
  emit({ type: "result_delivered", provider: chosen.provider, result });
  emit({
    type: "budget_updated",
    totalSpentTinybars: budget.totalSpentTinybars,
    maxTotalTinybars: config.maxTotalTinybars,
    callsMade: budget.callsMade,
    maxCalls: config.maxCalls,
    remainingTinybars: budget.remainingTinybars,
  });

  const paymentResponseHeader = execRes.headers.get("PAYMENT-RESPONSE") ?? execRes.headers.get("payment-response");
  const settlement = paymentResponseHeader ? decodePaymentResponseHeader(paymentResponseHeader) : undefined;

  if (!settlement?.transaction) {
    emit({ type: "run_complete", success: true });
    return { success: true, provider: chosen.provider };
  }

  emit({
    type: "payment_settled",
    provider: chosen.provider,
    priceTinybars: chosen.priceTinybars,
    transaction: settlement.transaction,
    hashscanUrl: `https://hashscan.io/testnet/transaction/${settlement.transaction}`,
  });

  const recorded = await recordReceipt({
    providerName: chosen.record.name,
    quoteId: chosen.quoteId,
    amountTinybars: chosen.priceTinybars,
    hederaTxId: settlement.transaction,
    resultHash: hashResult(result),
    timestamp: new Date().toISOString(),
  });
  emit({
    type: "receipt_recorded",
    topicId: recorded.topicId,
    sequenceNumber: recorded.hcsSequenceNumber,
    mirrorNodeUrl: recorded.mirrorNodeUrl,
  });

  const reputation = await updateReputation(chosen.record.name, chosen.record.resolverAddress, latencyMs);
  emit({ type: "reputation_updated", provider: chosen.provider, ...reputation });

  emit({ type: "run_complete", success: true });
  return { success: true, provider: chosen.provider, transaction: settlement.transaction };
}
