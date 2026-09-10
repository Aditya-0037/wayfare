import "dotenv/config";
import { writeFileSync } from "node:fs";
import { AccountId, AccountInfoQuery, Client, Hbar, PrivateKey, TransferTransaction } from "@x402/hedera";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (see apps/agent/.env.example)`);
  return value;
}

// Mints a fresh, minimally-funded payer account for the public-facing deployment, isolated
// from the main dev/testing payer. Worst case (a bug, or someone hammering the public demo)
// is bounded by this account's balance, not by application-level budget logic alone.
async function main() {
  const operatorId = AccountId.fromString(requireEnv("HEDERA_PAYER_ACCOUNT_ID"));
  const operatorKey = PrivateKey.fromStringECDSA(requireEnv("HEDERA_PAYER_PRIVATE_KEY"));
  const fundingTinybars = Number(process.argv[2] ?? 300_000_000); // default 3 HBAR

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  const newKey = PrivateKey.generateECDSA();
  const aliasAccountId = newKey.publicKey.toAccountId(0, 0);
  const fundingHbar = Hbar.fromTinybars(fundingTinybars);

  console.log(`[setup] funding a new public-demo payer account (${fundingHbar.toString()}) ...`);
  const transferTx = await new TransferTransaction()
    .addHbarTransfer(operatorId, fundingHbar.negated())
    .addHbarTransfer(aliasAccountId, fundingHbar)
    .execute(client);
  await transferTx.getReceipt(client);

  const info = await new AccountInfoQuery().setAccountId(aliasAccountId).execute(client);
  const realAccountId = info.accountId.toString();

  const outFile = ".env.public-payer.local";
  writeFileSync(
    outFile,
    [
      `HEDERA_PAYER_ACCOUNT_ID=${realAccountId}`,
      `HEDERA_PAYER_PRIVATE_KEY=${newKey.toStringRaw().startsWith("0x") ? newKey.toStringRaw() : "0x" + newKey.toStringRaw()}`,
      "",
    ].join("\n"),
  );

  console.log("");
  console.log(`Public demo payer account: ${realAccountId}`);
  console.log(`Funded with: ${fundingHbar.toString()}`);
  console.log(`Credentials written to ${outFile} (gitignored) — set these as Render env vars, never commit.`);

  client.close();
}

main().catch((err) => {
  console.error("[setup] fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
