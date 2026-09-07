import "dotenv/config";
import { publishAgentIdentity } from "../src/identity.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const topicId = requireEnv("HCS14_TOPIC_ID");

// One-time publish of HCS-14 identities for the agent and each provider. Account ids here
// are this deployment's real, already-created Hedera accounts (see README.md's Status
// section and apps/providers/*/.env) — not a discovery mechanism, just what's being
// identified.
const entities: { registry: string; name: string; nativeId: string }[] = [
  { registry: "wayfare", name: "wayfare-agent", nativeId: `hedera:testnet:${requireEnv("HEDERA_PAYER_ACCOUNT_ID")}` },
  { registry: "wayfare", name: "wayfare-swift", nativeId: "hedera:testnet:0.0.10377545" },
  { registry: "wayfare", name: "wayfare-deep", nativeId: "hedera:testnet:0.0.10403535" },
  { registry: "wayfare", name: "wayfare-niche", nativeId: "hedera:testnet:0.0.10403536" },
];

async function main() {
  for (const entity of entities) {
    const published = await publishAgentIdentity(topicId, {
      registry: entity.registry,
      name: entity.name,
      version: "1.0.0",
      protocol: "x402",
      nativeId: entity.nativeId,
      skills: [],
    });
    console.log(`${entity.name}: ${published.uaid}`);
    console.log(`  ${published.mirrorNodeUrl}`);
  }
}

main().catch((err) => {
  console.error("fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
