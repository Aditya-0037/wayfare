import { createHash } from "node:crypto";
import bs58 from "bs58";

// HCS-14 (Hashgraph Online, draft): a deterministic, network-agnostic agent identifier.
// https://hol.org/docs/standards/hcs-14/
//
// The published spec page describes the six canonical fields as "alphabetically
// sorted," but the actual reference implementation
// (github.com/hashgraph-online/standards-sdk, src/hcs-14/canonical.ts) orders them
// [skills, name, nativeId, protocol, registry, version] — not alphabetical. Matched to
// the real code here, not the prose, since interoperability depends on the exact bytes
// that get hashed. Same for base58: their src/hcs-14/base58.ts uses the standard Bitcoin
// alphabet, which is what the `bs58` npm package also uses, so results are compatible.
export interface Hcs14Input {
  registry: string;
  name: string;
  version: string;
  protocol: string;
  nativeId: string;
  skills: number[];
}

export interface Hcs14Id {
  uaid: string;
  hash: string;
  canonical: string;
}

export function computeAgentId(input: Hcs14Input, uid: string | number = 0): Hcs14Id {
  const normalized = {
    skills: [...input.skills].sort((a, b) => a - b),
    name: input.name.trim(),
    nativeId: input.nativeId.trim(),
    protocol: input.protocol.trim().toLowerCase(),
    registry: input.registry.trim().toLowerCase(),
    version: input.version.trim(),
  };

  const canonical = JSON.stringify(normalized);
  const digest = createHash("sha384").update(canonical, "utf8").digest();
  const hash = bs58.encode(digest);

  const uaid =
    `uaid:aid:${hash};uid=${uid};registry=${normalized.registry};` +
    `proto=${normalized.protocol};nativeId=${normalized.nativeId}`;

  return { uaid, hash, canonical };
}
