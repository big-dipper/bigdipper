---
title: How it's built
description: Little Dipper's application stack. TypeScript end to end, a REST API with an OpenAPI spec, an MCP server for AI assistants, SQLite on a disk you own, and standard cryptography.
---

Little Dipper is one small program that runs on one computer, for one person. Everything below ships in a single Docker image, `ghcr.io/big-dipper/littledipper`, for Intel and ARM machines. It's open source under the AGPL-3.0.

## At a glance

| Layer | What we use | Why |
|---|---|---|
| Language | **TypeScript**, end to end | One language from the database to the screen |
| Server | **Node.js** and **Fastify** | Small, fast, and runs anywhere |
| Data | **SQLite** on a persistent disk (`/data`) | One file, no database server to run, easy to back up and move |
| API | **REST**, described by an **OpenAPI 3.1** spec | The only way in, for our own screens and everyone else's |
| AI assistants | **MCP** (Model Context Protocol), Streamable HTTP | Claude, ChatGPT, Muse and others connect with standard tools |
| Assistant sign-in | **OAuth**, or an app key | Assistants get a key with exactly the access the owner chose |
| Owner sign-in | **Passkeys** (WebAuthn) | No passwords to steal or forget |
| Screens | **React** and **Vite** | A swappable front end that uses the same public API |
| Built-in assistant | Anthropic's API, or any **OpenAI-compatible** API | Claude, ChatGPT, or open models through OpenRouter, Together, Fireworks or your own |
| Node identity | **Ed25519** keys; the node ID comes from its public key | Each Little Dipper proves who it is, with no central registry |
| Between nodes | **Signed JSON** messages over HTTPS | Connections, sharing and messages, verified on both ends |
| Encryption | **AES-256-GCM** for secret details, files and backups; **scrypt** for the recovery kit; **Argon2** for the optional password | Standard, well-reviewed building blocks |
| Packaging | **Docker** (multi-architecture) | The same image on a cloud, a home server or a Raspberry Pi |

## A few principles behind the choices

- **The API is the only front door.** Little Dipper's own screens, AI assistants (through MCP) and other apps all go through the same REST API, with the same permissions and the same activity log. No screen or tool gets a private shortcut around it. See the [API reference](/docs/api/).
- **Nothing to run but Little Dipper.** No separate database server, queue or cache. That's what lets it run on a $5 cloud machine or a computer at home.
- **Only additions, never breaking changes.** The API has no version numbers, and every change is checked automatically so apps keep working for decades. See [Compatibility](/docs/concepts/compatibility/).
- **Features you check for, not versions.** Apps ask a node what it can do, rather than which version it runs. See [Compatibility](/docs/concepts/compatibility/) and [AI assistants](/docs/build/ai-assistants/).
- **Standard pieces only.** Passkeys, OAuth, MCP, OpenAPI and well-known cryptography, so anyone can build on it without learning anything unusual.

## Big Dipper

Big Dipper, the home of Little Dipper, is separate and small: this website (Astro, with these docs in Starlight) and a service that Little Dippers can choose to connect to. The service is built on the same signed protocol, published as a small toolkit any company can use to talk to Little Dippers. See [Services](/docs/build/services/).

## Source

- Little Dipper: [github.com/big-dipper/littledipper](https://github.com/big-dipper/littledipper)
- Big Dipper: [github.com/big-dipper/bigdipper](https://github.com/big-dipper/bigdipper)
