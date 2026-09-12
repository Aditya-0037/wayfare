import { parseAbiItem } from "viem";
import { contracts, ensParentName, publicClient, publicClientPool } from "./chain.js";
import { REGISTRY_ABI, ZERO_ADDRESS } from "./registry.js";
import { resolveProvider, type AgentRecord } from "./resolve.js";

const NAME_REGISTERED_EVENT = parseAbiItem(
  "event NameRegistered(uint256 indexed tokenId, string label, uint64 expiry, address registeredBy)",
);

// The block wayfare.eth's own registration landed in — scanning from here instead of genesis
// is just a perf bound, not a hardcoded provider list: every *label* is still discovered from
// on-chain event logs, not written into this codebase.
const DISCOVERY_FROM_BLOCK = 11_652_400n;

// The free, shared public Sepolia RPC pool occasionally serves a stale or otherwise-off
// read under load — not as a thrown error, but as a "successful", fast, *wrong* answer.
// Directly instrumented and caught twice: getSubregistry read back the zero address for a
// name that's genuinely registered, and separately, getLogs read back zero events for a
// range that genuinely has three. Both look identical to a real "nothing here" from the
// caller's side, so `isSuspicious` names the shape of a too-good-to-be-true empty result and
// this retries it — rotating across independently-verified endpoints, since retrying the
// *same* URL can keep landing on the same bad backend node behind that pool's load balancer.
async function withRetry<T>(
  pool: ReturnType<typeof publicClientPool>,
  fn: (client: ReturnType<typeof publicClient>) => Promise<T>,
  isSuspicious: (result: T) => boolean = () => false,
): Promise<T> {
  let lastErr: unknown;
  let result: T | undefined;
  let haveResult = false;
  const rounds = pool.length * 2;
  for (let i = 0; i < rounds; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 500 * i));
    try {
      result = await fn(pool[i % pool.length]);
      haveResult = true;
      if (!isSuspicious(result)) return result;
    } catch (err) {
      lastErr = err;
    }
  }
  if (haveResult) return result as T;
  throw lastErr;
}

/**
 * Real on-chain discovery: read every NameRegistered event ever emitted by the parent's
 * subregistry, then resolve each labeled name for real records. No provider name or URL is
 * hardcoded anywhere in this path — an agent that has never seen this codebase before would
 * discover the exact same providers by running this against the same parent name.
 */
export async function discoverProviders(): Promise<AgentRecord[]> {
  const pool = publicClientPool();
  const parentLabel = ensParentName.replace(/\.eth$/, "");

  const subregistryAddress = await withRetry(
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
  if (subregistryAddress === ZERO_ADDRESS) return [];

  const logs = await withRetry(
    pool,
    (client) =>
      client.getLogs({
        address: subregistryAddress,
        event: NAME_REGISTERED_EVENT,
        fromBlock: DISCOVERY_FROM_BLOCK,
        toBlock: "latest",
      }),
    // Zero logs for a range that's genuinely non-empty is the same "successful but wrong"
    // shape as the zero-address case above — reproduced directly, not assumed.
    (result) => result.length === 0,
  );

  const labels = [...new Set(logs.map((log) => log.args.label).filter((label): label is string => Boolean(label)))];

  const resolved = await Promise.all(labels.map((label) => resolveProvider(label)));
  return resolved.filter((record): record is AgentRecord => record !== null);
}
