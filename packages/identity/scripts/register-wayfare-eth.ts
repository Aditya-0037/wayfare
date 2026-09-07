import { getAvailable } from "@ensdomains/ensjs/public";
import { commitName, deploySubregistry, deployVerifiableProxy, registerName } from "@ensdomains/ensjs/wallet";
import { randomSecret } from "@ensdomains/ensjs/utils";
import {
  MOCK_ERC20_ABI,
  contracts,
  deployerAccount,
  ensParentName,
  proxyAddressFrom,
  publicClient,
  walletClientFor,
} from "../src/chain.js";

const label = ensParentName.replace(/\.eth$/, "");
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

// ensjs@5.0.0-sepolia-fix.1's getRegisterPrice action targets a `getRegisterPrice(label,
// duration, paymentToken)` selector that the deployed ETHRegistrar doesn't actually have —
// its real, verified-on-Etherscan function is `rentPrice(label, owner, duration,
// paymentToken)`. Calling it directly here instead.
const RENT_PRICE_ABI = [
  {
    type: "function",
    name: "rentPrice",
    stateMutability: "view",
    inputs: [
      { name: "label", type: "string" },
      { name: "owner", type: "address" },
      { name: "duration", type: "uint64" },
      { name: "paymentToken", type: "address" },
    ],
    outputs: [
      { name: "base", type: "uint256" },
      { name: "premium", type: "uint256" },
    ],
  },
] as const;

async function main() {
  const account = deployerAccount();
  const wallet = walletClientFor(account);
  const client = publicClient();

  console.log(`[ens] registering ${ensParentName} for ${account.address}`);

  const available = await getAvailable(client, { name: ensParentName });
  if (!available) {
    throw new Error(`${ensParentName} is not available — pick a different ENS_PARENT_NAME`);
  }

  console.log("[ens] deploying our own resolver proxy (Enhanced Access Control lives here) ...");
  const resolverTxHash = await deployVerifiableProxy(wallet, {
    factoryAddress: contracts.ensVerifiableFactory.address,
    implAddress: contracts.ensDedicatedResolver.address,
  });
  const resolverReceipt = await client.waitForTransactionReceipt({ hash: resolverTxHash });
  const resolverAddress = proxyAddressFrom(resolverReceipt.logs);
  console.log(`[ens] resolver: ${resolverAddress}`);

  console.log("[ens] deploying a subregistry so wayfare.eth can hold subnames (swift, deep, niche, ...) ...");
  const subregistryTxHash = await deploySubregistry(wallet, {
    factoryAddress: contracts.ensVerifiableFactory.address,
    implAddress: contracts.ensUserRegistry.address,
  });
  const subregistryReceipt = await client.waitForTransactionReceipt({ hash: subregistryTxHash });
  const subregistryAddress = proxyAddressFrom(subregistryReceipt.logs);
  console.log(`[ens] subregistry: ${subregistryAddress}`);

  const secret = randomSecret();
  const registrationParams = {
    label,
    owner: account.address,
    duration: ONE_YEAR_SECONDS,
    secret,
    resolverAddress,
    subregistryAddress,
    paymentToken: contracts.usdc.address,
  };

  console.log("[ens] committing (anti-frontrunning) ...");
  const commitHash = await commitName(wallet, registrationParams);
  await client.waitForTransactionReceipt({ hash: commitHash });

  const [base, premium] = await client.readContract({
    address: contracts.ethRegistrar.address,
    abi: RENT_PRICE_ABI,
    functionName: "rentPrice",
    args: [label, account.address, BigInt(ONE_YEAR_SECONDS), contracts.usdc.address],
  });
  const price = ((base + premium) * 110n) / 100n; // 10% buffer, matches ensjs's own example
  console.log(`[ens] price: ${price} (raw units of MockUSDC)`);

  console.log("[ens] minting MockUSDC to cover the registration fee (real testnet contract, public mint()) ...");
  const mintHash = await wallet.writeContract({
    address: contracts.usdc.address,
    abi: MOCK_ERC20_ABI,
    functionName: "mint",
    args: [account.address, price],
  });
  await client.waitForTransactionReceipt({ hash: mintHash });

  console.log("[ens] approving the registrar to spend it ...");
  const approveHash = await wallet.writeContract({
    address: contracts.usdc.address,
    abi: MOCK_ERC20_ABI,
    functionName: "approve",
    args: [contracts.ethRegistrar.address, price],
  });
  await client.waitForTransactionReceipt({ hash: approveHash });

  console.log("[ens] registering ...");
  const registerHash = await registerName(wallet, registrationParams);
  const registerReceipt = await client.waitForTransactionReceipt({ hash: registerHash });

  console.log("");
  console.log(`${ensParentName} is registered.`);
  console.log(`  owner:       ${account.address}`);
  console.log(`  resolver:    ${resolverAddress}`);
  console.log(`  subregistry: ${subregistryAddress}`);
  console.log(`  tx:          https://sepolia.etherscan.io/tx/${registerReceipt.transactionHash}`);
  console.log("");
  console.log("Save these two addresses — packages/identity/scripts/setup-provider.ts needs them.");
}

main().catch((err) => {
  console.error("[ens] fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
