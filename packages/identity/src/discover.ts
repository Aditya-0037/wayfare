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

// The free, shared public Sepolia RPC endpoint occasionally serves a stale or otherwise-off
// read under load (observed directly: a real registered subregistry read back as the zero
// address, resolving in ~250ms — too fast to be a real round trip — then correctly on the
// very next attempt seconds later). One retry after a short pause is cheap and turns that
// transient flake into a non-event instead of a false "no providers found".
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * Real on-chain discovery: read every NameRegistered event ever emitted by the parent's
 * subregistry, then resolve each labeled name for real records. No provider name or URL is
 * hardcoded anywhere in this path — an agent that has never seen this codebase before would
 * discover the exact same providers by running this against the same parent name.
 */
export async function discoverProviders(): Promise<AgentRecord[]> {
  const client = publicClient();
  const pool = publicClientPool();
  const parentLabel = ensParentName.replace(/\.eth$/, "");

  const readSubregistryFrom = (rpcClient: ReturnType<typeof publicClient>) =>
    withRetry(() =>
      rpcClient.readContract({
        address: contracts.ensV2EthRegistry.address,
        abi: REGISTRY_ABI,
        functionName: "getSubregistry",
        args: [parentLabel],
      }),
    );

  // A real "not registered" parent and a flaky misread from the RPC pool's load balancer
  // look identical from here (a fast, successful, wrong zero address, not a thrown error) —
  // and retrying the *same* URL can keep landing on the same bad backend node behind that
  // load balancer. Rotating across independently-verified endpoints instead gives each
  // attempt a real chance of a different, correct node before this code believes a zero
  // address. Costs a couple of seconds at worst, turns a false "no providers found" into a
  // non-event.
  let subregistryAddress = ZERO_ADDRESS as Awaited<ReturnType<typeof readSubregistryFrom>>;
  for (let i = 0; subregistryAddress === ZERO_ADDRESS && i < pool.length * 2; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 500 * i));
    subregistryAddress = await readSubregistryFrom(pool[i % pool.length]);
  }
  if (subregistryAddress === ZERO_ADDRESS) return [];

  const logs = await withRetry(() =>
    client.getLogs({
      address: subregistryAddress,
      event: NAME_REGISTERED_EVENT,
      fromBlock: DISCOVERY_FROM_BLOCK,
      toBlock: "latest",
    }),
  );

  const labels = [...new Set(logs.map((log) => log.args.label).filter((label): label is string => Boolean(label)))];

  const resolved = await Promise.all(labels.map((label) => resolveProvider(label)));
  return resolved.filter((record): record is AgentRecord => record !== null);
}
