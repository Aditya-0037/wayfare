import { computeAgentId } from "../src/hcs14.js";

const result = computeAgentId({
  registry: "hol",
  name: "Support Agent",
  version: "1.0.0",
  protocol: "hcs-10",
  nativeId: "hedera:testnet:0.0.123456",
  skills: [17, 0],
});
console.log(result.canonical);
console.log(result.uaid);
