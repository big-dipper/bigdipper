/**
 * Try Big Dipper Hosting by hand: create one node, time it, print its claim link.
 *   FLY_API_TOKEN=... FLY_ORG=personal npx tsx scripts/hosting-try.ts [image]
 *   FLY_API_TOKEN=... FLY_ORG=personal npx tsx scripts/hosting-try.ts --destroy ld-xxxxxxxx
 */
import { flyFromEnv } from '../src/hosting/fly.js';
import { waitUntilAnswering } from '../src/hosting/host.js';

const host = flyFromEnv();
if (!host) throw new Error('Set FLY_API_TOKEN and FLY_ORG');

if (process.argv[2] === '--destroy') {
  await host.destroy(process.argv[3]);
  console.log(`Removed ${process.argv[3]}`);
} else {
  const image = process.argv[2] || 'ghcr.io/big-dipper/littledipper:0.4.8';
  const t0 = Date.now();
  const node = await host.createNode({ image, env: { LD_BIG_DIPPER_URL: 'off' } });
  const created = Date.now() - t0;
  const waited = await waitUntilAnswering(node.url);
  console.log(JSON.stringify({ id: node.id, url: node.url, createdMs: created, answeringAfterMs: waited, totalMs: Date.now() - t0 }));
  console.log(`Claim: ${node.claimUrl}`);
}
