import { parseAbiItem } from "viem";
import { contracts, ensParentName, publicClient } from "./chain.js";
import { REGISTRY_ABI, ZERO_ADDRESS } from "./registry.js";
import { resolveProvider, type AgentRecord } from "./resolve.js";

const NAME_REGISTERED_EVENT = parseAbiItem(
  "event NameRegistered(uint256 indexed tokenId, string label, uint64 expiry, address registeredBy)",
);

// The block wayfare.eth's own registration landed in — scanning from here instead of genesis
// is just a perf bound, not a hardcoded provider list: every *label* is still discovered from
// on-chain event logs, not written into this codebase.
const DISCOVERY_FROM_BLOCK = 11_652_400n;

/**
 * Real on-chain discovery: read every NameRegistered event ever emitted by the parent's
 * subregistry, then resolve each labeled name for real records. No provider name or URL is
 * hardcoded anywhere in this path — an agent that has never seen this codebase before would
 * discover the exact same providers by running this against the same parent name.
 */
export async function discoverProviders(): Promise<AgentRecord[]> {
  const client = publicClient();
  const parentLabel = ensParentName.replace(/\.eth$/, "");

  const subregistryAddress = await client.readContract({
    address: contracts.ensV2EthRegistry.address,
    abi: REGISTRY_ABI,
    functionName: "getSubregistry",
    args: [parentLabel],
  });
  if (subregistryAddress === ZERO_ADDRESS) return [];

  const logs = await client.getLogs({
    address: subregistryAddress,
    event: NAME_REGISTERED_EVENT,
    fromBlock: DISCOVERY_FROM_BLOCK,
    toBlock: "latest",
  });

  const labels = [...new Set(logs.map((log) => log.args.label).filter((label): label is string => Boolean(label)))];

  const resolved = await Promise.all(labels.map((label) => resolveProvider(label)));
  return resolved.filter((record): record is AgentRecord => record !== null);
}
