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

## HCS-14 agent identity

A separate HCS topic (`0.0.10404697`) carries one-time
[HCS-14](https://hol.org/docs/standards/hcs-14/) identity announcements for the agent and
each provider — a deterministic id (SHA-384 + base58 of six canonical fields) that anyone
can recompute independently from the published record and confirm it matches:

```
https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.10404697/messages
```

The published spec page describes the canonical fields as alphabetically ordered, but the
[real reference implementation](https://github.com/hashgraph-online/standards-sdk/blob/main/src/hcs-14/canonical.ts)
orders them `[skills, name, nativeId, protocol, registry, version]`. `packages/identity/src/hcs14.ts`
matches the actual code, verified against Mirror Node by recomputing the hash independently
of the code path that published it (`packages/identity/scripts/test-hcs14-spec-example.ts`
also checks against the spec's own worked example).

```
npm run create-identity-topic   # one-time
npm run publish-identities       # publishes agent + swift + deep + niche
```
