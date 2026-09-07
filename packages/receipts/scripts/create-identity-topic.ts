import { TopicCreateTransaction } from "@hiero-ledger/sdk";
import { hederaClient } from "../src/client.js";

async function main() {
  const client = hederaClient();
  const tx = await new TopicCreateTransaction().setTopicMemo("wayfare HCS-14 agent identities").execute(client);
  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId;

  console.log("HCS-14 identity topic created:", topicId?.toString());
  console.log(`Mirror Node: https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId?.toString()}/messages`);
  console.log("Put this in apps/agent/.env and packages/receipts/.env as HCS14_TOPIC_ID.");

  client.close();
}

main().catch((err) => {
  console.error("fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
