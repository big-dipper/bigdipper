---
title: People and sharing
description: Parties, relationships, connections between Little Dippers, and sharing by whole category.
---

## Parties

Every person and organisation in an owner's life is a **party**: their partner, their doctor, their bank, their landlord, an AI assistant. A party is stored once, with its contact details, and every entry that involves it links to it. Change the bank's phone number once and it's right everywhere.

Some parties run their own Little Dipper. Connecting with them turns the party into a live **connection**.

## Relationships

How the owner knows someone is itself an entry in the **Relationships** category: spouse, child, parent, friend, colleague, mentor, reference. It's dated, so a marriage has a start, and an end if it ends. One person can have several relationships with the owner: a sister and a business partner.

## Connections between Little Dippers

Two owners connect by sending a request (`POST /api/federation/requests`) or sharing an invite link. Once the other side accepts, the two nodes exchange tokens and can:

- read what each has shared with the other;
- send each other messages and tasks;
- tell each other when they move to a new address.

Everything between nodes is signed. See [Node to node](/docs/build/node-to-node/).

## Sharing

Owners share **whole categories** ("my Residences", "my Employment"), and they always see exactly what the other person will get before confirming. There are no per-field permission grids.

- **The basic profile** goes to every connection unless the owner chooses otherwise for someone: the profile lines the owner picks (their name, for example), always with their Little Dipper's address.
- **Whole categories**, either everything or current entries only, live: the other person always sees the latest.
- **Single entries**, when sharing a whole category would be too much.
- **Copies:** a snapshot of chosen entries, sent as a link or a file, for someone without a Little Dipper (an accountant, a landlord). They don't update.

Categories that hold IDs, health or money, and anything secret, need an extra confirmation to share.

## Sharing is not the same as capability

A node's [capabilities](/docs/concepts/compatibility/) say what its *software* can do, the same for every node on a release. Sharing says what *this owner* lets *this person* see. `calendar.share` means the software can share calendars, not that the owner shares theirs with you. Check both.
