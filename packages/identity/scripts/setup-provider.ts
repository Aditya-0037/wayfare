import { createSubnameV2, deployVerifiableProxy } from "@ensdomains/ensjs/wallet";
import { setResolver } from "@ensdomains/ensjs/wallet/v2";
import { encodeRoleBitmap, registryRoles } from "@ensdomains/ensjs/utils/v2";
import { DEDICATED_RESOLVER_ABI, ROLE_SET_TEXT, textResource } from "../src/dedicatedResolver.js";
import {
  contracts,
  deployerAccount,
  ensParentName,
  proxyAddressFrom,
  publicClient,
  recorderAccount,
  walletClientFor,
} from "../src/chain.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const FULL_REGISTRY_ROLE_BITMAP = encodeRoleBitmap(Object.keys(registryRoles) as (keyof typeof registryRoles)[]);

interface ProviderSpec {
  label: string;
  agentContext: string;
  webEndpoint: string;
}

async function setupProvider(spec: ProviderSpec, subregistryAddress: `0x${string}`) {
  const deployer = deployerAccount();
  const recorder = recorderAccount();
  const wallet = walletClientFor(deployer);
  const client = publicClient();
  const fullName = `${spec.label}.${ensParentName}`;

  // DedicatedResolver is genuinely dedicated to a single name (its setText/grantRoles take
  // no node/name argument at all — see src/dedicatedResolver.ts), so every provider subname
  // needs its own resolver instance, not a shared one.
  console.log(`[ens] deploying a dedicated resolver for ${fullName} ...`);
  const resolverTxHash = await deployVerifiableProxy(wallet, {
    factoryAddress: contracts.ensVerifiableFactory.address,
    implAddress: contracts.ensDedicatedResolver.address,
  });
  const resolverReceipt = await client.waitForTransactionReceipt({ hash: resolverTxHash });
  const resolverAddress = proxyAddressFrom(resolverReceipt.logs);
  console.log(`[ens] resolver: ${resolverAddress}`);

  console.log(`[ens] creating ${fullName} ...`);
  let createHash: `0x${string}` | undefined;
  try {
    createHash = await createSubnameV2(wallet, {
      registryAddress: subregistryAddress,
      label: spec.label,
      owner: deployer.address,
      subregistryAddress: ZERO_ADDRESS,
      resolverAddress,
      roleBitmap: FULL_REGISTRY_ROLE_BITMAP,
    });
    await client.waitForTransactionReceipt({ hash: createHash });
  } catch {
    console.log(`[ens] ${fullName} already exists, pointing it at the new dedicated resolver instead ...`);
    createHash = await setResolver(wallet, { label: spec.label, registryAddress: subregistryAddress, resolverAddress });
    await client.waitForTransactionReceipt({ hash: createHash });
  }

  console.log("[ens] setting agent-context ...");
  const contextHash = await wallet.writeContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "setText",
    args: ["agent-context", spec.agentContext],
  });
  await client.waitForTransactionReceipt({ hash: contextHash });

  console.log("[ens] setting agent-endpoint[web] ...");
  const webHash = await wallet.writeContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "setText",
    args: ["agent-endpoint[web]", spec.webEndpoint],
  });
  await client.waitForTransactionReceipt({ hash: webHash });

  console.log("[ens] setting initial wayfare.reputation ...");
  const initialReputation = JSON.stringify({ completed_calls: 0, disputes: 0, mean_latency_ms: null });
  const reputationHash = await wallet.writeContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "setText",
    args: ["wayfare.reputation", initialReputation],
  });
  await client.waitForTransactionReceipt({ hash: reputationHash });

  console.log(`[ens] granting ROLE_SET_TEXT on wayfare.reputation to the settlement recorder (${recorder.address}) ...`);
  console.log("[ens] this is the Enhanced Access Control guarantee: the provider holds no key at");
  console.log("[ens] all, and from this point on even the deployer can't rewrite this one key —");
  console.log("[ens] only the recorder can, and only for this specific text key.");
  const grantHash = await wallet.writeContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "grantRoles",
    args: [textResource("wayfare.reputation"), ROLE_SET_TEXT, recorder.address],
  });
  await client.waitForTransactionReceipt({ hash: grantHash });

  console.log("");
  console.log(`${fullName} is live.`);
  console.log(`  resolver: ${resolverAddress}`);
  console.log(`  tx (create):        https://sepolia.etherscan.io/tx/${createHash}`);
  console.log(`  tx (reputation role grant): https://sepolia.etherscan.io/tx/${grantHash}`);
}

const label = process.argv[2];
const subregistryAddress = process.argv[3] as `0x${string}` | undefined;

if (!label || !subregistryAddress) {
  console.error("usage: tsx scripts/setup-provider.ts <label> <subregistryAddress>");
  process.exit(1);
}

const specs: Record<string, ProviderSpec> = {
  swift: {
    label: "swift",
    agentContext:
      "Fast, shallow text summarizer. Returns the first two sentences of the input verbatim. " +
      "Flat fee, cheap, lower quality than deep. Network: hedera:testnet. Asset: HBAR (0.0.0). " +
      "Speaks x402 v2 exact scheme over Blocky402.",
    webEndpoint: "http://localhost:4001",
  },
};

const spec = specs[label];
if (!spec) {
  console.error(`no provider spec for "${label}" — add one to scripts/setup-provider.ts`);
  process.exit(1);
}

setupProvider(spec, subregistryAddress).catch((err) => {
  console.error("[ens] fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
