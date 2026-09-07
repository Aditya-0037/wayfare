import { parseEther } from "viem";
import { deployerAccount, publicClient, recorderAccount, walletClientFor } from "../src/chain.js";

const amount = process.argv[2] ?? "0.01";
const wallet = walletClientFor(deployerAccount());
const client = publicClient();
const recorder = recorderAccount();
const hash = await wallet.sendTransaction({ to: recorder.address, value: parseEther(amount) });
await client.waitForTransactionReceipt({ hash });
console.log(`funded recorder with ${amount} ETH:`, hash);
