---
title: Compatibility
description: Why software built on Little Dipper keeps working for decades. No versions, only additions, and features you check for.
---

Little Dippers are run by their owners, on their own schedules. At any moment, nodes on many different releases are talking to each other and to apps. So the API follows a few rules, checked automatically on every change.

## There is no version

Paths carry no version number (`/api/data/receipts`, never `/api/v1/…`), and never will. The `version` in a node's descriptor is for display and support only.

## Things are only ever added

New endpoints, new fields, new categories, new parts and new options can appear at any time. Nothing that exists is ever removed, renamed, retyped or given a new meaning. When something needs a better design, the better version is added next to it and the old one keeps working.

A check in Little Dipper's build compares every release with the last one and fails if anything was taken away.

## Ignore what you don't understand

- Your client must **ignore fields it doesn't know** in responses. That's what makes adding fields safe.
- **Options can grow.** Handle an option value you've never seen, usually with a generic fallback.
- Servers ignore unknown fields in your requests rather than rejecting them.

## Check features, not versions

Every node lists its **capabilities** in `/.well-known/little-dipper`. Before using a feature, check that it's there. If it's missing, do without it, quietly: a missing capability is never an error. A capability, once listed, is never removed.

| Capability | Means |
|---|---|
| `records` | Entries live at `/api/data/{category}` |
| `records.history` | Earlier versions and recently deleted entries |
| `records.provenance` | Entries say who last changed them |
| `parts.datetime` | The `datetime` part type |
| `calendar`, `calendar.share` | `GET /api/calendar`, and sharing events |
| `documents`, `documents.share-links` | Documents, and sharing them by link |
| `copies` | Snapshots sent to people without a Little Dipper |
| `messages` | Messages between nodes |
| `address-change` | Nodes tell each other when they move |
| `backups.device`, `recovery-kit`, `restore` | Backups to the owner's device, and restoring on new hardware |
| `mcp`, `assistants`, `oauth` | AI assistants: MCP, modes and review, OAuth sign-in |

## Errors

Errors are `{ "code": "…", "message": "…" }`. `code` is part of the API and keeps its meaning forever; `message` is for people and may change. Branch on `code`.

## Upgrades never lose data

Every release must start on data written by any earlier release, so owners can skip straight from an old version to the newest. Little Dipper backs up before every update.
