/**
 * Feedback into Linear: one issue per piece of feedback, the screenshot uploaded to Linear and shown in the issue,
 * annotations listed under it, and where it came from. The Linear key never leaves this service.
 *
 * Linear's API: a personal API key goes in the Authorization header as is (no "Bearer"). Files upload in two steps:
 * ask fileUpload for a signed URL, then PUT the bytes there with the headers it returns.
 */
import { markLabels, type Feedback, type Sink } from './feedback.js';

const API = 'https://api.linear.app/graphql';

/** labels.all go on every issue (product, source); labels by type are added per issue. */
export type LinearConfig = { apiKey: string; teamId: string; labels: { all: string[] } & Partial<Record<Feedback['type'], string>> };

/** From the environment, trimmed (a stray newline pasted into a dashboard otherwise fails as an "invalid UUID"). */
export function linearFromEnv(env = process.env): LinearConfig | null {
  const v = (k: string) => (env[k] || '').trim();
  if (!v('LINEAR_API_KEY') || !v('LINEAR_TEAM_ID')) return null;
  return {
    apiKey: v('LINEAR_API_KEY'), teamId: v('LINEAR_TEAM_ID'),
    labels: { all: v('LINEAR_LABELS').split(',').map((x) => x.trim()).filter(Boolean), bug: v('LINEAR_LABEL_BUG'), idea: v('LINEAR_LABEL_IDEA'), question: v('LINEAR_LABEL_QUESTION'), other: v('LINEAR_LABEL_OTHER') },
  };
}

async function gql<T>(cfg: LinearConfig, query: string, variables: object): Promise<T> {
  const res = await fetch(API, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: cfg.apiKey },
    body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as { data?: T; errors?: unknown[] } | null;
  if (!res.ok || !json || json.errors?.length) {
    console.error('[linear] error', res.status, JSON.stringify(json?.errors ?? json).slice(0, 2000));
    throw new Error(`Linear answered ${res.status}`);
  }
  return json.data as T;
}

async function upload(cfg: LinearConfig, png: Buffer, filename: string): Promise<string> {
  const d = await gql<{ fileUpload: { success: boolean; uploadFile: { uploadUrl: string; assetUrl: string; headers: { key: string; value: string }[] } | null } }>(cfg,
    `mutation($size: Int!, $contentType: String!, $filename: String!) {
       fileUpload(size: $size, contentType: $contentType, filename: $filename) { success uploadFile { uploadUrl assetUrl headers { key value } } }
     }`,
    { size: png.byteLength, contentType: 'image/png', filename });
  const f = d.fileUpload.uploadFile;
  if (!d.fileUpload.success || !f) throw new Error('Linear gave no upload URL');
  const headers = new Headers({ 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000' });
  for (const { key, value } of f.headers) headers.set(key, value);
  const put = await fetch(f.uploadUrl, { method: 'PUT', headers, body: new Uint8Array(png), signal: AbortSignal.timeout(30_000) });
  if (!put.ok) throw new Error(`Linear upload answered ${put.status}`);
  return f.assetUrl;
}

const TYPE_WORD = { bug: 'Bug', idea: 'Idea', question: 'Question', other: 'Feedback' } as const;

function title(f: Feedback) {
  const first = f.comment.split(/\r?\n/)[0].trim();
  return `${TYPE_WORD[f.type]}: ${first.length > 80 ? first.slice(0, 79) + '…' : first}`;
}

/** Readable by a person triaging, and regular enough for an agent to parse later. */
export function describe(f: Feedback, assetUrl: string | null) {
  const out = [f.comment, ''];
  const labels = markLabels(f.marks);
  if (labels.length) out.push('### On the screenshot', ...labels.map((m) => `**${m.label}** ${m.comment || '_(no comment)_'}`), '');
  if (assetUrl) out.push('### Screenshot', f.context.blurred ? '_Page content blurred by the owner’s Little Dipper before sending._' : '_Sent unblurred, by the owner’s choice._', `![screenshot](${assetUrl})`, '');
  const row = (k: string, v: string | null | undefined) => (v ? `- **${k}:** ${v}` : null);
  out.push('### Where', [
    row('Page', f.context.route),
    row('Little Dipper', `${f.context.version}${f.context.hosting ? ` on ${f.context.hosting}` : ''}`),
    row('Screen', f.context.viewport ? `${f.context.viewport.w}×${f.context.viewport.h}` : null),
    row('Look', f.context.appearance),
    row('Browser', f.context.userAgent),
    row('From', `${f.from.nodeId} at ${f.from.address} (reply through Big Dipper)`),
    row('Received', f.receivedAt),
  ].filter(Boolean).join('\n'));
  return out.join('\n');
}

export function linearSink(cfg: LinearConfig): Sink {
  return {
    name: 'Linear',
    async file(f) {
      const assetUrl = f.screenshot ? await upload(cfg, f.screenshot, `feedback-${Date.now()}.png`) : null;
      const labelIds = [...cfg.labels.all, cfg.labels[f.type]].filter((x): x is string => !!x);
      const d = await gql<{ issueCreate: { success: boolean; issue: { identifier: string } | null } }>(cfg,
        `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier } } }`,
        { input: { teamId: cfg.teamId, title: title(f), description: describe(f, assetUrl), labelIds } });
      if (!d.issueCreate.success || !d.issueCreate.issue) throw new Error('Linear created no issue');
      return { reference: d.issueCreate.issue.identifier };
    },
  };
}
