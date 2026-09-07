# receipts

One HCS topic (`0.0.10403773` on Hedera testnet). Every settled call gets anchored with
provider ENS name, quote id, amount, Hedera tx id, a SHA-256 hash of the result, and a
timestamp — verifiable by anyone via Mirror Node, independent of this codebase's own word:

```
https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10403773/messages
```

## Usage

```ts
import { recordReceipt, hashResult } from "@wayfare/receipts";

const recorded = await recordReceipt({
  providerName: "deep.wayfare.eth",
  quoteId: "...",
  amountTinybars: 400000,
  hederaTxId: settlement.transaction,
  resultHash: hashResult(result),
  timestamp: new Date().toISOString(),
});
```

Reuses the agent's own `HEDERA_PAYER_ACCOUNT_ID` / `HEDERA_PAYER_PRIVATE_KEY` — the agent is
the one that just saw the settlement, so it's the one reporting it.

## Setup (already done for this repo's topic)

```
npm run create-topic
```

Prints a topic id — put it in `apps/agent/.env` and `packages/receipts/.env` as
`HCS_TOPIC_ID`.
