---
title: Build a service
description: Take part in the Little Dipper network as an organisation, without running a node, using the Apache-2.0 service kit.
---

Organisations don't run Little Dippers: a node always belongs to one person. Instead, an organisation takes part as a **service**. It has its own identity, says what it offers, accepts connections from people's Little Dippers, answers their signed calls and writes back to their Messages. It holds no one's life and asks for no profile.

Big Dipper is the first service. Its first capability is **feedback**: owners send a bug report or idea from inside their Little Dipper, and Big Dipper files it and replies.

## The kit

The service kit is in the Little Dipper repository under [`kit/`](https://github.com/big-dipper/littledipper/tree/main/kit). It's licensed **Apache-2.0**, so businesses can build on it freely.

- `protocol.ts`: identity, canonical JSON, Ed25519 signatures, envelopes, descriptors. It uses only `node:crypto`.
- `service.ts`: `createService()` and an adapter for Fastify.

It needs no database. Callers are checked by their signature and the key their own address publishes.

## A minimal service

```ts
import Fastify from 'fastify';
import { identityFromSecret } from './kit/protocol.js';
import { createService, fastifyAdapter } from './kit/service.js';

const service = createService({
  identity: identityFromSecret(process.env.SERVICE_SECRET!), // the same secret means the same ID, forever
  address: 'https://service.example.com',
  displayName: 'Example Co',
  version: '1.0.0',
  capabilities: {
    async hello({ caller, data }) {
      // caller.id is the node's ID, checked; data is what the owner chose to send
      setTimeout(() => service.sendMessage(caller, 'Thanks, we got it.'), 1000);
      return { ok: true };
    },
  },
});

const app = Fastify();
fastifyAdapter(app, service);
await app.listen({ port: 4500, host: '0.0.0.0' });
```

That gives you:

- `/.well-known/little-dipper`, describing the service (`kind: "service"`, `capabilities: ["hello"]`);
- accepting connection requests, by default from any verified node (pass `acceptRequest` to decide);
- `POST /peer/services/hello`, which runs your handler for connected nodes only;
- `service.sendMessage(caller, text)`, which writes into the owner's Messages.

## How owners see it

In a Little Dipper, a service shows up as an **organisation** among the owner's relationships. The owner chooses which of its capabilities to use, can see everything it sent, and can disconnect at any time.

## Rules for services

- **Ask only for what the capability needs**, and say what you'll do with it before the owner sends anything.
- **Never hold more than you must.** Big Dipper's service stores nothing itself: feedback goes straight to the team's tracker, and the owner is told where before they send.
- **Keep the identity secret safe and never change it.** Nodes remember your ID; a new secret is a new service.
