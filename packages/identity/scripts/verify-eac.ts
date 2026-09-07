import { namehash } from "viem/ens";
import { DEDICATED_RESOLVER_ABI, ROLE_SET_TEXT, textResource } from "../src/dedicatedResolver.js";
import { publicClient, recorderAccount, walletClientFor } from "../src/chain.js";

const fullName = process.argv[2];
const resolverAddress = process.argv[3] as `0x${string}` | undefined;

if (!fullName || !resolverAddress) {
  console.error("usage: tsx scripts/verify-eac.ts <full.name.eth> <resolverAddress>");
  process.exit(1);
}

const client = publicClient();
const recorder = recorderAccount();
const recorderWallet = walletClientFor(recorder);

console.log("--- records resolve live from chain, no hardcoded values ---");
for (const key of ["agent-context", "agent-endpoint[web]", "wayfare.reputation"]) {
  const value = await client.readContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "text",
    args: [namehash(fullName), key],
  });
  console.log(`${key}: ${value}`);
}

console.log("");
console.log("--- the settlement recorder can update reputation ---");
const hash = await recorderWallet.writeContract({
  address: resolverAddress,
  abi: DEDICATED_RESOLVER_ABI,
  functionName: "setText",
  args: ["wayfare.reputation", JSON.stringify({ completed_calls: 1, disputes: 0, mean_latency_ms: 812 })],
});
await client.waitForTransactionReceipt({ hash });
console.log(`recorder's write succeeded: https://sepolia.etherscan.io/tx/${hash}`);

console.log("");
console.log("--- but that grant is scoped to exactly that one key — nothing else ---");
for (const key of ["agent-context", "agent-endpoint[web]"]) {
  const has = await client.readContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "hasRoles",
    args: [textResource(key), ROLE_SET_TEXT, recorder.address],
  });
  if (has) {
    console.log(`WRONG: recorder can also write "${key}" — the grant is too broad`);
    continue;
  }
  try {
    await recorderWallet.writeContract({
      address: resolverAddress,
      abi: DEDICATED_RESOLVER_ABI,
      functionName: "setText",
      args: [key, "tampered"],
    });
    console.log(`WRONG: recorder's write to "${key}" went through`);
  } catch {
    console.log(`recorder's write to "${key}" correctly reverts on-chain`);
  }
}
