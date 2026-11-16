---
title: Quickstart
description: Make an app key, then read and write entries on a Little Dipper with curl.
---

This takes about five minutes. You need a Little Dipper you own. The [shared demo](https://little-dipper-demo.onrender.com/api/auth/demo) is fine for looking around, but it resets every hour and doesn't allow making keys.

## 1. Make an app key

In your Little Dipper, open **Settings → Apps and access**, turn on **Show technical details**, and choose **New API key**.

- Give it a name you'll recognise later ("My script").
- Pick only the scopes it needs. For this guide: `records:read` and `records:write`.
- Copy the key. It starts with `ldk_` and is shown only once.

Keys can be revoked any time, and every change a key makes is logged and can be undone. If you're connecting an AI assistant, use [the assistant route](/docs/build/ai-assistants/) instead: it adds review and undo.

```sh
export LD=https://your-little-dipper.example
export KEY=ldk_live_…
```

## 2. Check who you are

```sh
curl -H "Authorization: Bearer $KEY" $LD/api/keys/me
```

This returns the key's name, scopes and expiry, which is useful for confirming your setup.

## 3. See the categories

```sh
curl -H "Authorization: Bearer $KEY" $LD/api/catalog
```

Every category comes back with its parts (fields), which parts are required, how sensitive it is and how many entries it holds. The same schemas are in the [API reference](/docs/api/).

## 4. Add an entry

```sh
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  $LD/api/data/pets \
  -d '{ "data": { "name": "Juniper", "species": "Dog", "breed": "Border collie" }, "validFrom": "2021-04" }'
```

`validFrom` and `validTo` say when something was true. Dates can be partial (`2021`, `2021-04` or `2021-04-18`), because people rarely remember the day.

## 5. Read entries back

```sh
curl -H "Authorization: Bearer $KEY" "$LD/api/data/pets?current=true"
```

Each entry carries its `data`, a readable `title`, whether it's `current`, who created it (`source`) and who last changed it (`updatedBy`). Secret parts come back masked; see [Privacy and sensitivity](/docs/concepts/privacy/).

## 6. Change and undo

```sh
curl -X PATCH -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  $LD/api/data/pets/rec_… -d '{ "data": { "breed": "Australian shepherd" } }'
```

Every change keeps the previous version. The owner can see it at `/api/data/pets/{id}/history` and restore any version.

## When things go wrong

Errors come back as `{ "code": "…", "message": "…" }` with a matching HTTP status. Branch on `code`, which is stable. `message` is for people and may change.

| Status | Usually means |
|---|---|
| 401 | The key is missing, wrong or revoked |
| 403 | The key doesn't have the scope, or this needs the owner themselves |
| 404 | No such entry or category |
| 409 | It conflicts with the current state (already decided, already exists) |
