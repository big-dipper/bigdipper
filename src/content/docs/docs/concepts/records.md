---
title: Records and categories
description: How Little Dipper holds a life's data, as entries in categories, each part typed, dated and kept with its history.
---

Everything an owner knows about their life is stored as **entries** in **categories**: a job in Employment, a home in Residences, a passport in Government IDs, a receipt in Receipts. Little Dipper comes with 33 built-in categories, and owners can create their own.

## Categories

Each category has:

- **an id**, used in the API: `/api/data/employment`;
- **parts**, its fields, each with a type (below) and, for some, *required*;
- **a sensitivity**: how private its entries are unless the owner says otherwise (see [Privacy](/docs/concepts/privacy/));
- whether it's **dated**: whether entries say when they were true.

`GET /api/catalog` lists every category with its full schema, so apps never have to hard-code them. The [API reference](/docs/api/) has the same schemas.

Owners can add their own categories. Their ids always start with `x_` (`x_wine_cellar`), so they can never clash with built-in ones.

## Entries

```json
{
  "id": "rec_…",
  "domain": "employment",
  "title": "Product designer at Alder Studio",
  "data": { "employer": "pty_…", "title": "Product designer", "type": "full_time" },
  "validFrom": "2021-03",
  "validTo": null,
  "current": true,
  "source": { "type": "owner" },
  "updatedBy": { "type": "app", "id": "key_…" }
}
```

- **`data`** holds the parts, following the category's schema.
- **`validFrom` / `validTo`** say when it was true. No `validTo` means it still is (`current: true`).
- **`source`** and **`updatedBy`** say who created and who last changed it: the owner, an app, an assistant or an import. Owners can always tell their own data from anything an app or assistant added.

## Part types

| Type | Holds |
|---|---|
| `text`, `longtext` | Words |
| `date` | A partial ISO date: `2021`, `2021-04` or `2021-04-18` |
| `datetime` | A moment and its time zone: `{ "at": "2026-11-04T09:30:00-05:00", "tz": "America/New_York" }` |
| `money` | `{ "amount": 1250, "currency": "USD" }` |
| `address` | `{ street1, street2, city, region, postalCode, country }` |
| `country`, `region`, `currency` | ISO codes: `US`, `US-OR`, `USD` |
| `enum` | One of the category's options. Options can be added over time, so handle values you don't know |
| `party` | The id of a person or organisation (see [People and sharing](/docs/concepts/people-and-sharing/)) |
| `record` | The id of another entry: "proven by" this passport, "pays for" this car |
| `list` | Rows of sub-parts, such as a receipt's line items |

People and organisations are always **parties**, never typed names. An employer, a landlord or a doctor is stored once and linked from every entry that involves them.

## History and undo

Nothing is overwritten. Every change keeps the previous version:

- `GET /api/data/{category}/{id}/history`: every version, newest first, and who made each change;
- `POST …/history/{version}/restore`: make an older version current again (as a new change);
- `GET /api/data/{category}/deleted`: entries deleted in the last 30 days, which can be brought back.

An app's or assistant's changes can also be undone session by session, without touching anything the owner changed afterwards.
