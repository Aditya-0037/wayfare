import { namehash } from "viem/ens";
import { DEDICATED_RESOLVER_ABI } from "./dedicatedResolver.js";
import { publicClient, recorderAccount, walletClientFor } from "./chain.js";

export interface Reputation {
  completed_calls: number;
  disputes: number;
  mean_latency_ms: number | null;
}

/**
 * RECORD (ENS half): the settlement recorder — not the provider, not even the deployer's
 * general admin role — is the only identity allowed to write this key (see
 * scripts/setup-provider.ts's EAC grant). Called once per successful settlement.
 */
export async function updateReputation(name: string, resolverAddress: `0x${string}`, latencyMs: number): Promise<Reputation> {
  const client = publicClient();
  const node = namehash(name);

  const current = (await client.readContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "text",
    args: [node, "wayfare.reputation"],
  })) as string;

  const previous: Reputation = current
    ? (JSON.parse(current) as Reputation)
    : { completed_calls: 0, disputes: 0, mean_latency_ms: null };

  const completedCalls = previous.completed_calls + 1;
  const meanLatencyMs =
    previous.mean_latency_ms === null
      ? latencyMs
      : Math.round((previous.mean_latency_ms * previous.completed_calls + latencyMs) / completedCalls);

  const next: Reputation = { completed_calls: completedCalls, disputes: previous.disputes, mean_latency_ms: meanLatencyMs };

  const recorder = recorderAccount();
  const wallet = walletClientFor(recorder);
  const hash = await wallet.writeContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "setText",
    args: ["wayfare.reputation", JSON.stringify(next)],
  });
  await client.waitForTransactionReceipt({ hash });

  return next;
}
