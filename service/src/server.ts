/**
 * Big Dipper's service: the part of Big Dipper that Little Dippers connect to. Built on the service kit, so Big Dipper
 * is a service (it interacts, holds no one's life) and never a node.
 *
 * Capabilities so far: feedback (filed in Linear). Later: support, interface checks, upgrades, verification. Each
 * is one entry in `capabilities`; the platform-wide choices (storage, accounts, the support model) are still open,
 * so this stays small and stateless: no database.
 *
 * Environment:
 *   BD_IDENTITY_SECRET   required. Big Dipper's identity comes from it; keep it secret and never change it
 *                        (nodes remember the identity). On Render, use "Generate".
 *   BD_PUBLIC_URL        the address nodes reach this at (defaults to Render's RENDER_EXTERNAL_URL)
 *   LINEAR_API_KEY, LINEAR_TEAM_ID, LINEAR_LABELS (comma-separated, on every issue), LINEAR_LABEL_BUG|IDEA|QUESTION|OTHER
 *                        where feedback goes. Without them, feedback is written to ./feedback-outbox (development).
 *   FLY_API_TOKEN, FLY_ORG, FLY_REGION   turn on Big Dipper Hosting (POST /hosting/start). BD_HOSTING_IMAGE picks the
 *                        Little Dipper release; BD_HOSTING_PER_IP_PER_DAY limits new nodes per address (default 3).
 *   PORT                 default 4500
 */
import Fastify from 'fastify';
import { identityFromSecret } from './kit/protocol.js';
import { createService, fastifyAdapter } from './kit/service.js';
import { folderSink, parseFeedback } from './feedback.js';
import { linearFromEnv, linearSink } from './linear.js';
import { flyFromEnv } from './hosting/fly.js';
import { waitUntilAnswering } from './hosting/host.js';

const VERSION = '0.1.0';
const env = process.env;
const port = Number(env.PORT || 4500);
const address = (env.BD_PUBLIC_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).replace(/\/+$/, '');
if (!env.BD_IDENTITY_SECRET) throw new Error('Set BD_IDENTITY_SECRET: Big Dipper’s identity comes from it');
const identity = identityFromSecret(env.BD_IDENTITY_SECRET);

const linear = linearFromEnv();
const sink = linear ? linearSink(linear) : folderSink(env.FEEDBACK_OUTBOX || './feedback-outbox');

const app = Fastify({ logger: { level: env.LOG_LEVEL || 'info' }, trustProxy: true, bodyLimit: 8 * 1024 * 1024 });

const service = createService({
  identity, address, displayName: 'Big Dipper', version: VERSION,
  log: (msg, extra) => app.log.info({ extra }, msg),
  capabilities: {
    async feedback({ caller, data }) {
      const f = parseFeedback(caller, data);
      const { reference } = await sink.file(f);
      app.log.info({ reference, from: caller.id, type: f.type, screenshot: !!f.screenshot }, 'feedback filed');
      // A note in their Messages too, after we've answered, so they have it later.
      setTimeout(() => {
        service.sendMessage(caller, `Thanks for your ${f.type === 'other' ? 'feedback' : f.type === 'idea' ? 'idea' : f.type === 'question' ? 'question' : 'bug report'}. It’s filed as ${reference}. If we need more, or when there’s news, we’ll write here.`)
          .catch((e) => app.log.warn({ err: String(e) }, 'could not send the thank-you message'));
      }, 1500);
      return { reference };
    },
  },
});

fastifyAdapter(app, service);

// Big Dipper Hosting: "Get my Little Dipper" creates a node and sends the person straight to its claim page.
// No Big Dipper account: their node is their account. Off unless FLY_API_TOKEN and FLY_ORG are set.
const host = flyFromEnv();
if (host) {
  const image = env.BD_HOSTING_IMAGE || 'ghcr.io/big-dipper/littledipper:latest';
  const perIpPerDay = Number(env.BD_HOSTING_PER_IP_PER_DAY || 3);
  const recent = new Map<string, number[]>();
  app.post('/hosting/start', async (req, reply) => {
    // A brake on someone creating nodes in a loop. Stateless, so it resets when the service restarts.
    const now = Date.now();
    const times = (recent.get(req.ip) || []).filter((t) => now - t < 86400_000);
    if (times.length >= perIpPerDay) return reply.code(429).send({ error: 'too_many', message: 'That’s a lot of new Little Dippers from one place today. Try again tomorrow, or write to us.' });
    recent.set(req.ip, [...times, now]);
    const node = await host.createNode({ image, env: { LD_HOSTED_BY: 'bigdipper', LD_BIG_DIPPER_URL: address } });
    await waitUntilAnswering(node.url);
    app.log.info({ node: node.id, region: node.region }, 'hosted node created');
    return { url: node.url, claimUrl: node.claimUrl };
  });
}
app.get('/', async () => ({ service: 'Big Dipper', id: identity.id, version: VERSION, capabilities: service.descriptor().capabilities }));

await app.listen({ port, host: '0.0.0.0' });
app.log.info(`Big Dipper service ${identity.id} at ${address}; feedback goes to ${sink.name}`);
