/**
 * Feedback: the first thing Big Dipper does for Little Dippers. A node sends what its owner wrote, an optional
 * screenshot (blurred in their browser unless they chose otherwise), annotation marks and where in the app it
 * happened. We hand it to a sink and answer with a reference the owner can quote.
 *
 * Sinks are the seam: Linear today (linear.ts), a folder on disk for development, something else later. Nothing here
 * knows which one is in use.
 */
import type { Caller } from './kit/service.js';
import { ProtocolError } from './kit/protocol.js';

export type Mark = { kind: 'pin' | 'box' | 'arrow'; x: number; y: number; w?: number; h?: number; x2?: number; y2?: number; comment?: string };
export type Feedback = {
  type: 'bug' | 'idea' | 'question' | 'other';
  comment: string;
  screenshot: Buffer | null;
  marks: Mark[];
  context: { route: string; viewport: { w: number; h: number } | null; blurred: boolean; appearance: string; version: string; hosting: string; userAgent: string };
  from: { nodeId: string; address: string };
  receivedAt: string;
};
export type Sink = { name: string; file: (f: Feedback) => Promise<{ reference: string }> };

const TYPES = ['bug', 'idea', 'question', 'other'] as const;
const PNG = 'data:image/png;base64,';

/** Check and shape what a node sent. Anything off is refused, not guessed at. */
export function parseFeedback(caller: Caller, data: Record<string, unknown>): Feedback {
  const type = String(data.type) as Feedback['type'];
  if (!TYPES.includes(type)) throw new ProtocolError(400, 'invalid_value', 'Unknown feedback type');
  const comment = String(data.comment ?? '').trim().slice(0, 5000);
  if (!comment) throw new ProtocolError(400, 'invalid_value', 'Feedback needs a comment');
  const shot = typeof data.screenshot === 'string' && data.screenshot.startsWith(PNG) ? Buffer.from(data.screenshot.slice(PNG.length), 'base64') : null;
  const marks = (Array.isArray(data.marks) ? data.marks : []).slice(0, 64)
    .filter((m): m is Mark => !!m && typeof m === 'object' && ['pin', 'box', 'arrow'].includes((m as Mark).kind));
  const c = (data.context ?? {}) as Record<string, unknown>;
  const vp = c.viewport as { w?: number; h?: number } | null;
  return {
    type, comment, screenshot: shot && shot.length ? shot : null, marks,
    context: {
      route: String(c.route ?? '').slice(0, 200),
      viewport: vp && Number.isFinite(vp.w) && Number.isFinite(vp.h) ? { w: Number(vp.w), h: Number(vp.h) } : null,
      blurred: c.blurred !== false,
      appearance: String(c.appearance ?? '').slice(0, 80),
      version: String(c.version ?? caller.version ?? '').slice(0, 40),
      hosting: String(c.hosting ?? '').slice(0, 60),
      userAgent: String(c.userAgent ?? '').slice(0, 300),
    },
    from: { nodeId: caller.id, address: caller.address },
    receivedAt: new Date().toISOString(),
  };
}

/** Pins are numbered and boxes lettered in the order placed, matching what's drawn on the screenshot. */
export function markLabels(marks: Mark[]) {
  let pin = 0, box = 0;
  const letter = (n: number) => { let s = ''; for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
  return marks.filter((m) => m.kind !== 'arrow').map((m) => ({ label: m.kind === 'pin' ? `#${++pin}` : letter(box++), comment: (m.comment || '').trim() }));
}

/** Development: write each piece of feedback to a folder (JSON plus the PNG). */
export function folderSink(dir: string): Sink {
  let n = 0;
  return {
    name: `folder ${dir}`,
    async file(f) {
      const { mkdir, writeFile } = await import('node:fs/promises');
      await mkdir(dir, { recursive: true });
      const reference = `LOCAL-${Date.now().toString(36)}-${++n}`;
      await writeFile(`${dir}/${reference}.json`, JSON.stringify({ ...f, screenshot: f.screenshot ? `${reference}.png` : null }, null, 2));
      if (f.screenshot) await writeFile(`${dir}/${reference}.png`, f.screenshot);
      return { reference };
    },
  };
}
