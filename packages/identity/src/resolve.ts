import { namehash } from "viem/ens";
import { contracts, ensParentName, publicClientPool } from "./chain.js";
import { REGISTRY_ABI, ZERO_ADDRESS } from "./registry.js";
import { DEDICATED_RESOLVER_ABI } from "./dedicatedResolver.js";
import { withRetry } from "./rpcRetry.js";

export interface AgentRecord {
  name: string;
  resolverAddress: `0x${string}`;
  agentContext: string;
  endpoints: Record<string, string>;
}

/**
 * Resolve one provider subname under the ENS_PARENT_NAME root, per ENSIP-26: load
 * agent-context first; if it's absent, the name is undiscoverable — no fallback, no guess.
 * Then load whichever agent-endpoint[protocol] records are actually set.
 *
 * Every read here is retried against the RPC pool (see rpcRetry.ts): a resolved provider
 * silently vanishing from discovery because one flaky read came back empty is exactly the
 * "successful but wrong" failure mode caught directly in discover.ts, and this function has
 * four separate reads exposed to the same risk.
 */
export async function resolveProvider(label: string): Promise<AgentRecord | null> {
  const pool = publicClientPool();
  const parentLabel = ensParentName.replace(/\.eth$/, "");

  const parentRegistry = await withRetry(
    pool,
    (client) =>
      client.readContract({
        address: contracts.ensV2EthRegistry.address,
        abi: REGISTRY_ABI,
        functionName: "getSubregistry",
        args: [parentLabel],
      }),
    (address) => address === ZERO_ADDRESS,
  );
  if (parentRegistry === ZERO_ADDRESS) return null;

  const resolverAddress = await withRetry(
    pool,
    (client) =>
      client.readContract({
        address: parentRegistry,
        abi: REGISTRY_ABI,
        functionName: "getResolver",
        args: [label],
      }),
    (address) => address === ZERO_ADDRESS,
  );
  if (resolverAddress === ZERO_ADDRESS) return null;

  const name = `${label}.${ensParentName}`;
  const node = namehash(name);

  const agentContext = await withRetry(
    pool,
    (client) =>
      client.readContract({
        address: resolverAddress,
        abi: DEDICATED_RESOLVER_ABI,
        functionName: "text",
        args: [node, "agent-context"],
      }),
    (text) => !text,
  );
  if (!agentContext) return null; // absent agent-context => undiscoverable, per ENSIP-26

  const endpoints: Record<string, string> = {};
  for (const protocol of ["mcp", "web", "a2a"]) {
    const value = await withRetry(pool, (client) =>
      client.readContract({
        address: resolverAddress,
        abi: DEDICATED_RESOLVER_ABI,
        functionName: "text",
        args: [node, `agent-endpoint[${protocol}]`],
      }),
    );
    if (value) endpoints[protocol] = value;
  }

  return { name, resolverAddress, agentContext, endpoints };
}
