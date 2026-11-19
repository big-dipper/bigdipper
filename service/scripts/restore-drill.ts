/**
 * Restore drill: prove a hosted node can be lost and brought back from its owner's backup and recovery kit.
 *   FLY_API_TOKEN=... FLY_ORG=personal npx tsx scripts/restore-drill.ts [image]
 *
 * 1. Create node A, sign in with a one-time test link, add a record, take a recovery kit and a backup.
 * 2. Delete node A, disk and all.
 * 3. Create node B and restore onto it with the kit, its passphrase and the backup.
 * 4. Check B has A's identity and the record. Then delete B.
 * The test sign-in link (LD_DEMO_SIGNIN) exists only on drill nodes; real nodes never have it.
 */
import { randomBytes } from 'node:crypto';
import { flyFromEnv } from '../src/hosting/fly.js';
import { waitUntilAnswering, type HostedNode } from '../src/hosting/host.js';

const host = flyFromEnv();
if (!host) throw new Error('Set FLY_API_TOKEN and FLY_ORG');
const image = process.argv[2] || 'ghcr.io/big-dipper/littledipper:0.4.8';
const step = (m: string) => console.log(`· ${m}`);

async function call(node: HostedNode, cookie: string, method: string, path: string, body?: unknown) {
  const r = await fetch(`${node.url}${path}`, {
    method, headers: { cookie, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${text.slice(0, 300)}`);
  return text;
}

const made: HostedNode[] = [];
try {
  const t0 = Date.now();
  const signin = randomBytes(16).toString('hex');
  const a = await host.createNode({ image, env: { LD_BIG_DIPPER_URL: 'off', LD_DEMO_SIGNIN: signin } });
  made.push(a);
  await waitUntilAnswering(a.url);
  step(`Node A ${a.id} answering`);

  const r = await fetch(`${a.url}/api/auth/demo?t=${signin}`, { redirect: 'manual' });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  if (!cookie) throw new Error(`no session from the test sign-in link (${r.status})`);
  const statusA = JSON.parse(await call(a, cookie, 'GET', '/api/node/status'));

  const marker = `Restore drill ${new Date().toISOString()}`;
  await call(a, cookie, 'POST', '/api/data/notes', { data: { text: `${marker}: if you can read this on node B, the drill worked.` } });
  step('Added a note');

  const passphrase = randomBytes(12).toString('hex');
  const kit = JSON.parse(await call(a, cookie, 'POST', '/api/node/recovery-kit', { passphrase }));
  const backups = JSON.parse(await call(a, cookie, 'POST', '/api/node/backups', {}));
  const id = backups.id || backups.backup?.id || backups._id;
  const bundle = await call(a, cookie, 'GET', `/api/node/backups/${id}/download`);
  step(`Took the recovery kit and backup ${id} (${Math.round(bundle.length / 1024)} KB)`);

  await host.destroy(a.id);
  made.shift();
  step(`Deleted node A, disk and all`);

  const b = await host.createNode({ image, env: { LD_BIG_DIPPER_URL: 'off' } });
  made.push(b);
  await waitUntilAnswering(b.url);
  const restored = await fetch(`${b.url}/api/node/claim/restore`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: b.claimUrl, kit, passphrase, backup: bundle }),
  });
  const rj = await restored.json() as { restored?: boolean; nodeId?: string; movedFrom?: string; documents?: number };
  if (!restored.ok) throw new Error(`restore failed: ${restored.status} ${JSON.stringify(rj)}`);
  const cookieB = (restored.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  step(`Restored onto node B ${b.id}: node ID ${rj.nodeId}, moved from ${rj.movedFrom}`);

  const notes = await call(b, cookieB, 'GET', '/api/data/notes');
  const sameId = rj.nodeId === (statusA.nodeId || kit.nodeId);
  const hasNote = notes.includes(marker);
  console.log(JSON.stringify({ sameIdentity: sameId, noteCameBack: hasNote, totalSeconds: Math.round((Date.now() - t0) / 1000) }));
  if (!sameId || !hasNote) process.exitCode = 1;
} finally {
  for (const n of made) await host.destroy(n.id).catch((e) => console.error(`could not delete ${n.id}: ${e}`));
  step('Cleaned up');
}
