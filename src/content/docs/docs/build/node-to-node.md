---
title: Node to node
description: How Little Dippers find each other, prove who they are, connect, share and message, with no server in the middle.
---

Little Dippers talk to each other directly. There's no central server and no directory. Each node proves who it is with a key only it holds.

## Identity

Every node has an Ed25519 signing key. Its **Node ID** is computed from the public key:

```text
ldn_ + base32(sha256(public key)), first 26 characters
```

Because the ID comes from the key, it can't be claimed by anyone else, and it stays the same when the node moves to a new address. The public key is published in `/.well-known/little-dipper`.

## Signed envelopes

Every call between nodes is a signed envelope:

```json
{
  "payload": { "type": "message", "body": "…", "from": "ldn_q4m2…", "ts": 1794839873731, "nonce": "w3kq…" },
  "signature": "base64 Ed25519 signature"
}
```

- The signature covers the payload as **canonical JSON** (keys sorted, no spaces), so both sides sign the same bytes.
- `from` is the sender's Node ID, checked against the key its address publishes.
- `ts` and `nonce` stop replays: an envelope that is too old, or that the node has already seen, is refused.

## Connecting

1. **Look up** the other node's descriptor and check its ID matches its key.
2. **Request:** a signed envelope to their `POST /peer/requests`, with a note and what you'd like to share.
3. Their owner **accepts** in their own Little Dipper. Their node calls your `POST /peer/requests/{id}/accept` with a token for reading what they share, and gets yours back.
4. Either side can **disconnect** at any time (`/peer/links/revoke`). Tokens stop working on both sides.

An invite link skips the waiting: whoever has the link may connect straight away.

## After connecting

| Endpoint | For |
|---|---|
| `GET /peer/profile`, `/peer/fields` | Their basic profile and the extra lines they share |
| `GET /peer/domains`, `/peer/domains/{category}` | Whole categories they share |
| `POST /peer/messages` | Messages and tasks. The sender picks the id, so retries are safe |
| `POST /peer/links/changed` | "What I share with you changed": the other node syncs |
| `POST /peer/address-change` | "I moved": verified against the stored key, then the address is updated |

A node that's offline gets its messages later: senders retry with backoff.
