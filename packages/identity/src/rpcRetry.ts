import { publicClient, publicClientPool } from "./chain.js";

// The free, shared public Sepolia RPC pool occasionally serves a stale or otherwise-off read
// under load — not as a thrown error, but as a "successful", fast, *wrong* answer. Caught
// directly, twice, in packages/identity/src/discover.ts: getSubregistry read back the zero
// address for a name that's genuinely registered, and getLogs read back zero events for a
// range that genuinely has three. Both look identical to a real "nothing here" from the
// caller's side, so `isSuspicious` names the shape of a too-good-to-be-true empty result and
// this retries it — rotating across independently-verified endpoints, since retrying the
// *same* URL can keep landing on the same bad backend node behind that pool's load balancer.
export async function withRetry<T>(
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
