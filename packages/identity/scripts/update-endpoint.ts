import { DEDICATED_RESOLVER_ABI } from "../src/dedicatedResolver.js";
import { deployerAccount, ensParentName, publicClient, walletClientFor } from "../src/chain.js";

const label = process.argv[2];
const resolverAddress = process.argv[3] as `0x${string}`;
const newUrl = process.argv[4];

if (!label || !resolverAddress || !newUrl) {
  console.error("usage: tsx scripts/update-endpoint.ts <label> <resolverAddress> <newUrl>");
  process.exit(1);
}

async function main() {
  const deployer = deployerAccount();
  const wallet = walletClientFor(deployer);
  const client = publicClient();

  const hash = await wallet.writeContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "setText",
    args: ["agent-endpoint[web]", newUrl],
  });
  await client.waitForTransactionReceipt({ hash });
  console.log(`${label}.${ensParentName} agent-endpoint[web] -> ${newUrl}`);
  console.log(`tx: https://sepolia.etherscan.io/tx/${hash}`);
}

main().catch((err) => {
  console.error("fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
