import "dotenv/config";
import { Client, AccountId, PrivateKey } from "@hiero-ledger/sdk";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (see packages/receipts/.env.example)`);
  return value;
}

export function hederaClient(): Client {
  const accountId = AccountId.fromString(requireEnv("HEDERA_PAYER_ACCOUNT_ID"));
  const privateKey = PrivateKey.fromStringECDSA(requireEnv("HEDERA_PAYER_PRIVATE_KEY"));
  return Client.forTestnet().setOperator(accountId, privateKey);
}

export function topicId(): string {
  return requireEnv("HCS_TOPIC_ID");
}
