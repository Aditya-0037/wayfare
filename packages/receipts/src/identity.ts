import { TopicMessageSubmitTransaction, TopicId } from "@hiero-ledger/sdk";
import { computeAgentId, type Hcs14Input } from "@wayfare/identity";
import { hederaClient } from "./client.js";

export interface PublishedIdentity {
  uaid: string;
  hcsTransactionId: string;
  hcsSequenceNumber: string;
  mirrorNodeUrl: string;
}

/**
 * Publishes an HCS-14 agent identity announcement to the given topic — the canonical
 * fields plus the computed uaid, so anyone can recompute the hash independently and
 * confirm it matches what's on Mirror Node.
 */
export async function publishAgentIdentity(topicIdString: string, input: Hcs14Input): Promise<PublishedIdentity> {
  const { uaid, canonical } = computeAgentId(input);
  const client = hederaClient();
  const topic = TopicId.fromString(topicIdString);

  const message = JSON.stringify({ type: "hcs-14-identity", uaid, canonical: JSON.parse(canonical) });
  const tx = await new TopicMessageSubmitTransaction({ topicId: topic, message }).execute(client);
  const receipt = await tx.getReceipt(client);
  const sequenceNumber = receipt.topicSequenceNumber?.toString() ?? "unknown";
  client.close();

  return {
    uaid,
    hcsTransactionId: tx.transactionId.toString(),
    hcsSequenceNumber: sequenceNumber,
    mirrorNodeUrl: `https://testnet.mirrornode.hedera.com/api/v1/topics/${topic.toString()}/messages/${sequenceNumber}`,
  };
}
