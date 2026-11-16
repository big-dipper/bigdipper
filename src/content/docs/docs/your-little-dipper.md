---
title: Your Little Dipper
description: One person, one server, one address. What a Little Dipper is, and what that means for anyone building on it.
---

A Little Dipper (we also call it a *node*) is a small server that belongs to one person, its **owner**. It runs on their own cloud account or on a computer at home, and it holds their life's data. Nobody else's data is ever on it, and a business never runs one on someone's behalf.

## Every node has its own address

There is no `api.littledipper.com`. Each node answers at its own address, such as `https://maya.example` or `https://littledipper-production-1234.up.railway.app`, and serves the whole API there.

So an app or assistant always works with **one owner's node at a time**, at the address that owner gives it.

## Every node describes itself

Ask any node who it is:

```sh
curl https://maya.example/.well-known/little-dipper
```

```json
{
  "nodeId": "ldn_q4m2…",
  "version": "0.4.6",
  "signingKey": "MCowBQYDK2VwAyEA…",
  "displayName": "Maya Lindqvist",
  "address": "https://maya.example",
  "kind": "node",
  "capabilities": ["records", "records.history", "calendar", "documents", "messages", "mcp", "oauth", "…"]
}
```

- **`nodeId`** is the node's permanent identity. It's computed from its signing key (`ldn_` plus a hash), so it can't be faked and never changes, even when the address does.
- **`capabilities`** say what this node's software can do. Check them before using a feature; see [Compatibility](/docs/concepts/compatibility/).
- **`version`** is for display and support only. Never decide anything based on it.
- **`kind`** is `node` for a person's Little Dipper, or `service` for an organisation that takes part without running one (see [Build a service](/docs/build/services/)).

## What's on a node

- **Records:** everything the owner knows about their life, in categories such as Employment, Residences, Health and Financial accounts. See [Records and categories](/docs/concepts/records/).
- **People and organisations** in the owner's life, and how they relate. See [People and sharing](/docs/concepts/people-and-sharing/).
- **Documents:** scans, photos and PDFs, encrypted, linked to the entries they prove.
- **Messages and tasks** with connected people.
- **An activity log** of every read and change, by whom.

## Who can call it

| Who | How | See |
|---|---|---|
| The owner | Signs in with a passkey | [Authentication](/docs/build/authentication/) |
| Apps and scripts | An app key the owner made, with scopes | [Quickstart](/docs/quickstart/) |
| AI assistants | MCP, with an app key or OAuth | [AI assistants](/docs/build/ai-assistants/) |
| Other Little Dippers and services | Signed messages, after a connection is accepted | [Node to node](/docs/build/node-to-node/) |
| Anyone | Only what the owner publishes: their public page and the node descriptor | |
