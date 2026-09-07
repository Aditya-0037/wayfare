import { resolveProvider } from "../src/resolve.js";

const label = process.argv[2];
if (!label) {
  console.error("usage: tsx scripts/resolve-provider.ts <label>");
  process.exit(1);
}

const result = await resolveProvider(label);
if (!result) {
  console.log(`${label} — undiscoverable (no agent-context set, or the name doesn't exist)`);
} else {
  console.log(JSON.stringify(result, null, 2));
}
