/**
 * Fly.io as a host. Each node is its own Fly app with one machine and one volume (its disk), so nodes never share
 * anything. Uses Fly's Machines API, plus its GraphQL API for public addresses (the Machines API has no call for them).
 *
 * Settings: FLY_API_TOKEN (an org token), FLY_ORG (org slug), FLY_REGION (default dfw).
 * Honest limit, stated on the terms page: whoever holds the Fly account can run commands inside a running node.
 * Nothing in this file does; every such command shows up in the node's own Activity log.
 */
import { randomBytes } from 'node:crypto';
import type { Host, HostedNode, NewNode, NodeStatus } from './host.js';

const MACHINES = 'https://api.machines.dev/v1';
const GRAPHQL = 'https://api.fly.io/graphql';

type FlyOpts = { token: string; org: string; region?: string };

export function flyFromEnv(env = process.env): FlyHost | null {
  if (!env.FLY_API_TOKEN || !env.FLY_ORG) return null;
  return new FlyHost({ token: env.FLY_API_TOKEN, org: env.FLY_ORG, region: env.FLY_REGION });
}

export class FlyHost implements Host {
  readonly name = 'Fly.io';
  constructor(private o: FlyOpts) {}

  private auth() {
    // Org tokens come as "FlyV1 fm2_..."; older personal tokens are plain.
    return this.o.token.startsWith('FlyV1 ') ? this.o.token : `Bearer ${this.o.token}`;
  }

  private async api<T>(method: string, path: string, body?: unknown): Promise<T> {
    const r = await fetch(`${MACHINES}${path}`, {
      method, headers: { Authorization: this.auth(), 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Fly ${method} ${path}: ${r.status} ${text.slice(0, 300)}`);
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async gql(query: string, variables: Record<string, unknown>) {
    const r = await fetch(GRAPHQL, {
      method: 'POST', headers: { Authorization: this.auth(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const j = (await r.json()) as { errors?: { message: string }[] };
    if (!r.ok || j.errors?.length) throw new Error(`Fly GraphQL: ${j.errors?.map((e) => e.message).join('; ') || r.status}`);
  }

  async createNode(n: NewNode): Promise<HostedNode> {
    const app = `ld-${randomBytes(4).toString('hex')}`;
    const region = n.region || this.o.region || 'dfw';
    const claimToken = randomBytes(16).toString('hex');
    const url = `https://${app}.fly.dev`;

    await this.api('POST', '/apps', { app_name: app, org_slug: this.o.org });
    try {
      const allocate = 'mutation($input: AllocateIPAddressInput!) { allocateIpAddress(input: $input) { ipAddress { address } } }';
      const vol = this.api<{ id: string }>('POST', `/apps/${app}/volumes`, { name: 'data', region, size_gb: 1, encrypted: true });
      await Promise.all([
        this.gql(allocate, { input: { appId: app, type: 'shared_v4' } }),
        this.gql(allocate, { input: { appId: app, type: 'v6' } }),
      ]);
      const volume = await vol;
      await this.api('POST', `/apps/${app}/machines`, {
        name: 'node', region,
        config: {
          image: n.image,
          env: { ...n.env, LD_CLAIM_TOKEN: claimToken, LD_PUBLIC_URL: url },
          guest: { cpu_kind: 'shared', cpus: 1, memory_mb: 512 },
          mounts: [{ volume: volume.id, path: '/data' }],
          services: [{
            protocol: 'tcp', internal_port: 4000, autostop: 'off', autostart: true,
            ports: [{ port: 443, handlers: ['tls', 'http'] }, { port: 80, handlers: ['http'], force_https: true }],
          }],
          restart: { policy: 'always' },
          metadata: { 'big-dipper-hosting': '1' },
        },
      });
    } catch (e) {
      await this.api('DELETE', `/apps/${app}?force=true`).catch(() => {}); // never leave half a node behind
      throw e;
    }
    return { id: app, url, claimUrl: `${url}/claim?token=${claimToken}`, region, createdAt: new Date().toISOString() };
  }

  private async machine(app: string) {
    const list = await this.api<{ id: string; state: string; config: { image: string } }[]>('GET', `/apps/${app}/machines`);
    if (!list[0]) throw new Error(`${app} has no machine`);
    return list[0];
  }

  async updateImage(app: string, image: string) {
    const m = await this.machine(app);
    const full = await this.api<{ config: Record<string, unknown> }>('GET', `/apps/${app}/machines/${m.id}`);
    await this.api('POST', `/apps/${app}/machines/${m.id}`, { config: { ...full.config, image } });
  }

  async restart(app: string) {
    const m = await this.machine(app);
    await this.api('POST', `/apps/${app}/machines/${m.id}/restart`);
  }

  async status(app: string): Promise<NodeStatus> {
    try {
      const m = await this.machine(app);
      const state = m.state === 'started' ? 'running' : m.state === 'stopped' ? 'stopped' : ['created', 'starting'].includes(m.state) ? 'starting' : 'unknown';
      return { id: app, state, image: m.config.image };
    } catch (e) {
      if (/404/.test(String(e))) return { id: app, state: 'gone' };
      throw e;
    }
  }

  async destroy(app: string) {
    await this.api('DELETE', `/apps/${app}?force=true`);
  }
}
