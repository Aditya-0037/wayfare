import { keccak256, toBytes } from "viem";

// DedicatedResolver (ensDedicatedResolver impl) is genuinely dedicated to a single name —
// its setText has no `node` argument at all, unlike the older multi-tenant PublicResolver.
// ensjs's wallet/v1 setTextRecord and wallet/v2 grantResolverRoles actions both target that
// older, node-aware interface and revert against this contract. Calling it directly instead,
// verified via Etherscan source (DedicatedResolver.sol) and simulateContract before spending
// any gas on it.
export const DEDICATED_RESOLVER_ABI = [
  {
    type: "function",
    name: "setText",
    stateMutability: "nonpayable",
    inputs: [
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "text",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "grantRoles",
    stateMutability: "nonpayable",
    inputs: [
      { name: "resource", type: "uint256" },
      { name: "roleBitmap", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "hasRoles",
    stateMutability: "view",
    inputs: [
      { name: "resource", type: "uint256" },
      { name: "roleBitmap", type: "uint256" },
      { name: "account", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const ROLE_SET_TEXT = 16n;

/** Mirrors DedicatedResolverLib's per-key resource id: keccak256(bytes(key)). */
export function textResource(key: string): bigint {
  return BigInt(keccak256(toBytes(key)));
}
