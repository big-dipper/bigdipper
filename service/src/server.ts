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
 *   PORT                 default 4500
 */
import Fastify from 'fastify';
import { identityFromSecret } from './kit/protocol.js';
import { createService, fastifyAdapter } from './kit/service.js';
import { folderSink, parseFeedback } from './feedback.js';
import { linearFromEnv, linearSink } from './linear.js';

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
app.get('/', async () => ({ service: 'Big Dipper', id: identity.id, version: VERSION, capabilities: service.descriptor().capabilities }));

await app.listen({ port, host: '0.0.0.0' });
app.log.info(`Big Dipper service ${identity.id} at ${address}; feedback goes to ${sink.name}`);
