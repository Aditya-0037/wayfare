import { discoverProviders } from "../src/discover.js";

const providers = await discoverProviders();
console.log(`discovered ${providers.length} provider(s), no name or URL hardcoded anywhere:`);
console.log(JSON.stringify(providers, null, 2));
