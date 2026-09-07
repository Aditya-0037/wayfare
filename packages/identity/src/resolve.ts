import { namehash } from "viem/ens";
import { contracts, ensParentName, publicClient } from "./chain.js";
import { REGISTRY_ABI, ZERO_ADDRESS } from "./registry.js";
import { DEDICATED_RESOLVER_ABI } from "./dedicatedResolver.js";

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
 */
export async function resolveProvider(label: string): Promise<AgentRecord | null> {
  const client = publicClient();
  const parentLabel = ensParentName.replace(/\.eth$/, "");

  const parentRegistry = await client.readContract({
    address: contracts.ensV2EthRegistry.address,
    abi: REGISTRY_ABI,
    functionName: "getSubregistry",
    args: [parentLabel],
  });
  if (parentRegistry === ZERO_ADDRESS) return null;

  const resolverAddress = await client.readContract({
    address: parentRegistry,
    abi: REGISTRY_ABI,
    functionName: "getResolver",
    args: [label],
  });
  if (resolverAddress === ZERO_ADDRESS) return null;

  const name = `${label}.${ensParentName}`;
  const node = namehash(name);

  const agentContext = await client.readContract({
    address: resolverAddress,
    abi: DEDICATED_RESOLVER_ABI,
    functionName: "text",
    args: [node, "agent-context"],
  });
  if (!agentContext) return null; // absent agent-context => undiscoverable, per ENSIP-26

  const endpoints: Record<string, string> = {};
  for (const protocol of ["mcp", "web", "a2a"]) {
    const value = await client.readContract({
      address: resolverAddress,
      abi: DEDICATED_RESOLVER_ABI,
      functionName: "text",
      args: [node, `agent-endpoint[${protocol}]`],
    });
    if (value) endpoints[protocol] = value;
  }

  return { name, resolverAddress, agentContext, endpoints };
}
