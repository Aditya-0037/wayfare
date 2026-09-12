import "dotenv/config";
import { createPublicClient, createWalletClient, http, parseEventLogs, type Address, type Chain, type Log } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { addEnsL1Contracts } from "@ensdomains/ensjs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required (see packages/identity/.env.example)`);
  return value;
}

export const rpcUrl = process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
export const ensParentName = process.env.ENS_PARENT_NAME ?? "wayfare.eth";

// ENSv2 beta's "L2" contract set for chain id 11155111, as published inside
// @ensdomains/ensjs@5.0.0-sepolia-fix.1 (dist/clients/l2.js, not part of the package's
// public export map, so mirrored here). Each address independently verified via
// eth_getCode against https://ethereum-sepolia-rpc.publicnode.com to confirm real
// deployed contracts, not placeholders.
const ENS_L2_CONTRACTS = {
  ensVerifiableFactory: { address: "0xb9541bdd86c4d01c726a33694f14e8528adcb20d" as Address },
  ensUserRegistry: { address: "0x8cfbf4a6b3f546021b9f8e6099bda2cb0297cd25" as Address },
  ensV2EthRegistry: { address: "0xF332544e6234f1CA149907D0d4658afD5feB6831" as Address },
  ensDedicatedResolver: { address: "0xa20b41dc7336c4d974e3c9a6ea01b77647559c46" as Address },
  ethRegistrar: { address: "0x3334f0ebcbc4b5b7067f3aff25c6da8973690d54" as Address },
  // ensjs's own hardcoded l2.js usdc address (0x7Fc2...) is not actually accepted by the
  // live StandardRentPriceOracle (isPaymentToken -> false, reverts PaymentTokenNotSupported).
  // Found the real one from the oracle's PaymentTokenAdded event logs, verified on-chain
  // (isPaymentToken -> true, symbol "USDC", decimals 6, publicly mintable).
  usdc: { address: "0xeB704373997b676D111e4767e281B9fb3852ECeF" as Address },
} as const;

// Merge in the L1 set too (ensUniversalResolver, ensRegistry, ...) — the Universal Resolver
// is what routes standard ENS reads (getTextRecord, getRecords) across v1 and v2 alike, and
// several v2 read actions (getNameRegistries) require it on the chain object.
const sepoliaWithL1Ens = addEnsL1Contracts(sepolia);

export const sepoliaWithEnsV2 = {
  ...sepoliaWithL1Ens,
  contracts: { ...sepoliaWithL1Ens.contracts, ...ENS_L2_CONTRACTS },
} as Chain & typeof sepoliaWithL1Ens & { contracts: typeof sepoliaWithL1Ens.contracts & typeof ENS_L2_CONTRACTS };

export const contracts = ENS_L2_CONTRACTS;

export function deployerAccount() {
  return privateKeyToAccount(requireEnv("ENS_DEPLOYER_PRIVATE_KEY") as `0x${string}`);
}

export function recorderAccount() {
  return privateKeyToAccount(requireEnv("ENS_RECORDER_PRIVATE_KEY") as `0x${string}`);
}

export function publicClient() {
  return createPublicClient({ chain: sepoliaWithEnsV2, transport: http(rpcUrl) });
}

// Known-good independent Sepolia RPC endpoints, each verified directly against this
// project's own contracts (not just "responds to eth_blockNumber"). The default free public
// pool is a load balancer over many independent node operators — one of them can serve a
// stale or wrong read while the others are fine, so retrying the *same* URL can keep hitting
// the same bad node. Rotating across genuinely different providers instead gives each retry
// an independent chance instead of a repeat of the same flake.
const FALLBACK_RPC_URLS = ["https://ethereum-sepolia-rpc.publicnode.com", "https://sepolia.gateway.tenderly.co"];

export function publicClientPool(): ReturnType<typeof publicClient>[] {
  const urls = [rpcUrl, ...FALLBACK_RPC_URLS.filter((u) => u !== rpcUrl)];
  return urls.map((url) => createPublicClient({ chain: sepoliaWithEnsV2, transport: http(url) }));
}

export function walletClientFor(account: ReturnType<typeof privateKeyToAccount>) {
  return createWalletClient({ chain: sepoliaWithEnsV2, transport: http(rpcUrl), account });
}

export const PROXY_DEPLOYED_EVENT_ABI = [
  {
    type: "event",
    name: "ProxyDeployed",
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: true, name: "proxyAddress", type: "address" },
      { indexed: false, name: "salt", type: "uint256" },
      { indexed: false, name: "implementation", type: "address" },
    ],
  },
] as const;

export function proxyAddressFrom(logs: Log[]) {
  const events = parseEventLogs({ abi: PROXY_DEPLOYED_EVENT_ABI, logs });
  const deployed = events.find((e) => e.eventName === "ProxyDeployed");
  if (!deployed) throw new Error("no ProxyDeployed event found in transaction logs");
  return (deployed.args as { proxyAddress: `0x${string}` }).proxyAddress;
}

export const MOCK_ERC20_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;
