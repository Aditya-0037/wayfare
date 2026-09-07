import { createHash } from "node:crypto";
import { TopicMessageSubmitTransaction, TopicId } from "@hiero-ledger/sdk";
import { hederaClient, topicId } from "./client.js";

export { publishAgentIdentity, type PublishedIdentity } from "./identity.js";

export interface Receipt {
  providerName: string; // e.g. "swift.wayfare.eth"
  quoteId: string;
  amountTinybars: number;
  hederaTxId: string;
  resultHash: string;
  timestamp: string; // ISO 8601
}

export function hashResult(result: unknown): string {
  return createHash("sha256").update(JSON.stringify(result)).digest("hex");
}

export interface RecordedReceipt {
  receipt: Receipt;
  topicId: string;
  hcsSequenceNumber: string;
  hcsTransactionId: string;
  mirrorNodeUrl: string;
}

/**
 * RECORD: anchor one settled call to HCS. Anyone can independently confirm this receipt via
 * Mirror Node — it doesn't depend on trusting this codebase's own account of what happened.
 */
export async function recordReceipt(receipt: Receipt): Promise<RecordedReceipt> {
  const client = hederaClient();
  const topic = TopicId.fromString(topicId());

  const tx = await new TopicMessageSubmitTransaction({
    topicId: topic,
    message: JSON.stringify(receipt),
  }).execute(client);

  const receiptResult = await tx.getReceipt(client);
  const sequenceNumber = receiptResult.topicSequenceNumber?.toString() ?? "unknown";

  client.close();

  return {
    receipt,
    topicId: topic.toString(),
    hcsSequenceNumber: sequenceNumber,
    hcsTransactionId: tx.transactionId.toString(),
    mirrorNodeUrl: `https://testnet.mirrornode.hedera.com/api/v1/topics/${topic.toString()}/messages/${sequenceNumber}`,
  };
}
