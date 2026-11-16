---
title: Privacy and sensitivity
description: Standard, sensitive and secret. What's encrypted, what's masked, what's logged, and what never leaves the node.
---

Little Dipper holds the most private data people have, so privacy isn't a setting. It decides how every value is stored and shown.

## Three levels

Every entry, and every part of an entry, is one of:

| Level | Meant for | How it's treated |
|---|---|---|
| **Standard** | Things you'd tell an acquaintance: your city, your pets, where you work | Readable by anyone the owner shares it with |
| **Sensitive** | Things for people you trust: your home address, your birthday, your health | Shared only when the owner chooses it explicitly |
| **Secret** | Things that could hurt you if they leaked: ID numbers, account numbers, balances | Encrypted on disk, masked in every response, revealed only on request and logged |

Each category has a default level, and the owner can change it per entry. Some parts are always secret whatever the entry says: a passport number is never anything else.

## Secret values

Secret parts come back masked, and their names are listed in `masked`:

```json
{ "data": { "number": "•••• 4821" }, "masked": ["number"] }
```

To read the real value, an app or assistant with permission calls `POST /api/data/{category}/{id}/reveal`. Every reveal is written to the activity log, so the owner can see who looked at what and when. Assistants can only reveal the specific secret parts the owner allowed.

## What's encrypted on disk

Secret parts, documents and their pages, messages, copies sent to people, keys and tokens, and backups are all encrypted with keys that stay on the node. Standard and sensitive values are stored as they are, on a disk only the owner's hosting account can reach.

## What's logged

The activity log records every read by a connected person, every reveal, every change by an app or assistant, and every change to who can see what. It's the owner's: nothing is sent anywhere.

## What never leaves

- **Nodes don't phone home.** There's no analytics, no telemetry, no "usage data". Little Dipper never tells us, or anyone, what's on a node or how it's used.
- **Big Dipper never holds anyone's data or keys.** When a node connects to Big Dipper's services, it sends only what the owner sends, shown to them first.
- **AI assistants see only what the owner allows**, and what they read goes to the company that runs them. That's why access is chosen per assistant and can be narrowed or ended at any moment.

## Honest limits

- **Whoever runs the hardware could reach the disk.** On a cloud host, that's the hosting company. Secret values are encrypted, but standard and sensitive ones aren't. Owners can move to a computer at home whenever they like.
- **Losing every passkey and the recovery kit means losing access.** Nobody, including us, can unlock a Little Dipper without them.
