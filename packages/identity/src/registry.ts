// ensjs's own resolution helpers (getTextRecord/getRecords/getNameRegistries) don't yet see
// names registered through this ENSv2-beta L2 registry stack on Sepolia — verified by
// testing them directly against swift.wayfare.eth (they return null / zero resolver).
// This walks the real hierarchy ourselves: IRegistry.getSubregistry(label) down to the
// parent, then IRegistry.getResolver(label) for the child, matching PermissionedRegistry.sol
// (fetched from Etherscan/Blockscout's verified multi-file source for the deployed
// UserRegistry at 0x8cfbf4...cd25).
export const REGISTRY_ABI = [
  {
    type: "function",
    name: "getSubregistry",
    stateMutability: "view",
    inputs: [{ name: "label", type: "string" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getResolver",
    stateMutability: "view",
    inputs: [{ name: "label", type: "string" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
