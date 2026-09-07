import { namehash } from "viem/ens";
import { DEDICATED_RESOLVER_ABI } from "../src/dedicatedResolver.js";
import { publicClient } from "../src/chain.js";

const name = process.argv[2];
const resolverAddress = process.argv[3] as `0x${string}`;
const client = publicClient();
const value = await client.readContract({
  address: resolverAddress,
  abi: DEDICATED_RESOLVER_ABI,
  functionName: "text",
  args: [namehash(name), "wayfare.reputation"],
});
console.log(value);
