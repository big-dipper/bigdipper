/**
 * Big Dipper Hosting: one Little Dipper per person, each on its own small machine with its own disk, in our hosting
 * account. This file is the whole of what our tools can do to a hosted node: create it, move it to a new release,
 * restart it, look at its status, and remove it. There is deliberately nothing here that reads or changes what's
 * inside a node. That's the promise, and anyone can check it against this code.
 *
 * Each cloud is one `Host`. Fly.io is the first (fly.ts); a second (DigitalOcean) plugs in behind the same interface.
 */

export type NewNode = {
  /** Little Dipper image to run, e.g. ghcr.io/big-dipper/littledipper:0.4.8 */
  image: string;
  region?: string;
  /** Plain settings for the node. Business details (prices, trial length) never go here. */
  env?: Record<string, string>;
};

export type HostedNode = {
  /** The host's own name for it. Random: never the person's name. */
  id: string;
  /** Where the node answers, e.g. https://ld-3f9a1c2b.fly.dev */
  url: string;
  /** One-time link the person opens to claim the node with their passkey. */
  claimUrl: string;
  region: string;
  createdAt: string;
};

export type NodeStatus = { id: string; state: 'starting' | 'running' | 'stopped' | 'gone' | 'unknown'; image?: string };

export interface Host {
  readonly name: string;
  createNode(n: NewNode): Promise<HostedNode>;
  /** Move the node to another release. Its disk, and everything on it, stays as it is. */
  updateImage(id: string, image: string): Promise<void>;
  restart(id: string): Promise<void>;
  status(id: string): Promise<NodeStatus>;
  /** Remove the node and its disk. Only after the owner moved out, the grace period ended, or it was never claimed. */
  destroy(id: string): Promise<void>;
  /** Every node we host: just names, addresses and when they were made. */
  listNodes(): Promise<{ id: string; url: string; createdAt: string }[]>;
}

/**
 * A node nobody claimed within the hour is removed, disk and all. It holds nothing (claiming is the first thing that
 * happens on it), and it keeps robots that create nodes but never claim them from costing more than minutes.
 */
export async function removeUnclaimed(host: Host, maxAgeMs = 3600_000, log: (m: string) => void = () => {}) {
  for (const n of await host.listNodes()) {
    if (Date.now() - Date.parse(n.createdAt) < maxAgeMs) continue;
    try {
      const r = await fetch(`${n.url}/api/node/status`, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) continue; // can't tell: leave it for the next round, never guess
      const s = (await r.json()) as { claimed?: boolean };
      if (s.claimed === false) { await host.destroy(n.id); log(`Removed ${n.id}: not claimed within ${Math.round(maxAgeMs / 60000)} minutes`); }
    } catch { /* unreachable now: try again next round */ }
  }
}

/** Wait until a new node answers, so the person never lands on an error page. */
export async function waitUntilAnswering(url: string, timeoutMs = 180_000): Promise<number> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${url}/api/node/status`, { signal: AbortSignal.timeout(3000) });
      if (r.ok) return Date.now() - start;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${url} didn't answer within ${Math.round(timeoutMs / 1000)}s`);
}
