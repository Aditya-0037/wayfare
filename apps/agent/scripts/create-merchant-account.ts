import "dotenv/config";
import { AccountId, AccountInfoQuery, Client, Hbar, PrivateKey, TransferTransaction } from "@x402/hedera";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (see apps/agent/.env.example)`);
  return value;
}

async function main() {
  const operatorId = AccountId.fromString(requireEnv("HEDERA_PAYER_ACCOUNT_ID"));
  const operatorKey = PrivateKey.fromStringECDSA(requireEnv("HEDERA_PAYER_PRIVATE_KEY"));
  const fundingHbar = Hbar.fromTinybars(Number(process.argv[2] ?? 100_000_000)); // default 1 HBAR

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  const newKey = PrivateKey.generateECDSA();
  const aliasAccountId = newKey.publicKey.toAccountId(0, 0);

  console.log(`[setup] funding a new account via alias transfer (${fundingHbar.toString()}) ...`);
  const transferTx = await new TransferTransaction()
    .addHbarTransfer(operatorId, fundingHbar.negated())
    .addHbarTransfer(aliasAccountId, fundingHbar)
    .execute(client);

  await transferTx.getReceipt(client);

  const info = await new AccountInfoQuery().setAccountId(aliasAccountId).execute(client);

  console.log("");
  console.log("New merchant account created and funded:");
  console.log(`  Account ID: ${info.accountId.toString()}`);
  console.log("  No private key is saved — the merchant only ever receives payments in this");
  console.log("  system (see architecture: providers never settle on-chain themselves), so it");
  console.log("  never needs to sign anything.");
  console.log("");
  console.log("Put this in apps/providers/swift/.env as HEDERA_MERCHANT_ACCOUNT_ID.");

  client.close();
}

main().catch((err) => {
  console.error("[setup] fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
