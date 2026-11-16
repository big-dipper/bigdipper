---
title: AI assistants
description: Connect Claude, ChatGPT, Muse or a model you run yourself to a Little Dipper through MCP, with the owner in charge of what it sees and does.
---

Every Little Dipper has an **MCP server** built in, so any assistant that speaks the Model Context Protocol can use it: look things up, fill in forms, file documents, keep entries current and remind the owner of dates. The owner decides exactly what each assistant can see and do, and can change it or end it at any moment.

## The address

The MCP server is at `/api/mcp` on the owner's node (also listed as `mcp` in its descriptor):

```text
https://your-little-dipper.example/api/mcp
```

It speaks Streamable HTTP, keeps no sessions, and answers JSON-RPC over `POST`.

## Signing in

**With OAuth** (Claude, ChatGPT and other platforms with connector support):

1. The owner adds the address above as a connector in their assistant.
2. The assistant discovers the node's sign-in through `/.well-known/oauth-protected-resource` and registers itself.
3. The owner is sent to a consent page **on their own Little Dipper**, signs in with their passkey, and chooses what the assistant may see, its mode, which secret details it may read, and for how long.
4. The assistant gets a 30-minute access token and a refresh token. Authorization code with PKCE (S256); refresh tokens rotate.

**With a key**, for assistants that can't do OAuth: the owner adds the assistant under **Relationships → Add someone → An assistant**, chooses the same things on its page, and makes a key there for the assistant to use as a bearer token.

## Modes

Each assistant has a mode, chosen by the owner:

| Mode | Its changes |
|---|---|
| **Answer questions** | Changes nothing |
| **Suggest changes** | Wait in Review until the owner approves them |
| **Make changes** | Save straight away, logged and undoable |

Whatever the mode, some things **always wait for the owner**: secret values, and core identity (legal name, date of birth, citizenship, government IDs, the owner's own contact details and current address). An assistant can never manage keys, so it can never give itself more access.

## Tools

| Tool | Does |
|---|---|
| `whoami` | What this assistant may do, in this node's words |
| `get_profile` | The owner's profile and current details (address, city, legal name…) |
| `list_kinds` | The categories and their parts |
| `list_records`, `search_records`, `get_record` | Find and read entries |
| `add_record`, `add_records`, `update_record` | Add (up to 50 at once) and change entries |
| `find_parties`, `add_party` | People and organisations |
| `search_documents`, `get_document` | Find and read documents |
| `upload_document`, `file_document` | Add a document, and file it on an entry |
| `upcoming_dates` | Expiring IDs, renewals, birthdays, return-by dates |
| `list_review_items` | The assistant's own suggestions and what the owner decided |

Every tool calls the same API with the same key, so the key's scopes apply. There is no delete tool.

## Undo

Everything an assistant changes is grouped into sessions. The owner can undo a whole session or a single change. Anything the owner changed since is kept.

## Privacy

What an assistant reads goes to the company that runs it. That's why access is per assistant, can be narrowed to particular categories, and can be ended at any moment. Owners who want nothing to leave can connect an open-weight model they run themselves: it's just another MCP client.
