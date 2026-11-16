---
title: Authentication
description: The owner's passkey, app keys with scopes, OAuth for assistants, and signed calls between nodes.
---

There are four ways in. The API reference marks each endpoint with the one it needs.

## The owner: passkey sign-in

The owner signs in with a passkey (their face or fingerprint) and gets a session cookie. Some things only the owner can do, never a key, however trusted:

- changing who can see what (sharing);
- approving or turning down an assistant's suggestions;
- making and revoking keys from the web app;
- account, address and backup settings.

These endpoints are marked **ownerSession** in the reference.

## Apps and scripts: app keys

The owner makes a key in **Settings → Apps and access**. Send it as a bearer token:

```http
Authorization: Bearer ldk_live_…
```

Each key carries **scopes**, and an endpoint checks for the scope it needs:

| Scope | Allows |
|---|---|
| `owner:read`, `owner:write` | The owner's profile |
| `records:read`, `records:write` | Entries in every category |
| `{category}:read`, `{category}:write` | Entries in one category, e.g. `receipts:read` |
| `parties:read`, `parties:write` | People and organisations, and connections |
| `documents:read`, `documents:write` | Documents and their pages |
| `messages:read`, `messages:write` | Messages |
| `public:write` | The owner's public page |
| `audit:read` | The activity log |
| `export` | Full exports |
| `keys:manage` | Other keys (never allowed for assistants) |

`GET /api/keys/me` tells a key what it is: its name, scopes, assistant settings and expiry. The secret is shown once when the key is made and only its hash is stored. A revoked key stops working on its next request.

## AI assistants: OAuth or a key

Assistant platforms that support MCP sign in with OAuth 2.0: the owner approves on a consent page on their own node and chooses what the assistant may see and do. Assistants that can't do OAuth use a key made on the assistant's page. Either way, assistant keys have a **mode** and their changes can be reviewed and undone. See [AI assistants](/docs/build/ai-assistants/).

## Other Little Dippers and services: signatures

Calls between nodes under `/peer` are signed with the caller's Ed25519 key and checked against the key it publishes. Reads use a token exchanged when the connection was accepted. See [Node to node](/docs/build/node-to-node/).

## Setup: the claim code

A brand-new node is claimed with a one-time code its installer set. Once claimed, the code stops working. This only matters if you're building an installer or hosting integration.
