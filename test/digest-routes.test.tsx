import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';

const dirs: string[] = [];

function makeRunsDir(files: Record<string, string>): RigConfig {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  dirs.push(runsDir);
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(runsDir, name), body);
  }
  return { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir };
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const NIGHT_WITH_ROWS = [
  '{"at":"2026-10-28T02:00:00+02:00","job":"zeta-pack","status":"ok","owner":"mira"}',
  '{"at":"2026-10-28T03:00:00+02:00","job":"alpha-pack","status":"retry","owner":null}',
  '{"at":"2026-10-28T04:00:00+02:00","job":"alpha-pack","status":"fail","owner":null,"error":"boom"}',
  '',
].join('\n');

const NIGHT_WITH_BAD_LINE = [
  'not json at all',
  '{"at":"2026-10-28T01:00:00+01:00","job":"solo-pack","status":"ok","owner":"rook"}',
  '',
].join('\n');

describe('GET /digest/:night', () => {
  it('renders 200 with one row per job, sorted, marked rows flagged', async () => {
    const app = createApp(makeRunsDir({ '2026-10-28.jsonl': NIGHT_WITH_ROWS }));
    const res = await app.request('/digest/2026-10-28');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('alpha-pack');
    expect(html).toContain('zeta-pack');
    expect(html.indexOf('alpha-pack')).toBeLessThan(html.indexOf('zeta-pack'));
    expect(html).toContain('class="warn"');
    expect(html).toContain('boom');
    expect(html).toContain('mira');
  });

  it('404s a night with no file', async () => {
    const app = createApp(makeRunsDir({}));
    const res = await app.request('/digest/2026-10-28');
    expect(res.status).toBe(404);
  });

  it('renders "nothing ran" for an empty night', async () => {
    const app = createApp(makeRunsDir({ '2026-10-29.jsonl': '' }));
    const res = await app.request('/digest/2026-10-29');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
    expect(html).not.toContain('<table>');
  });

  it('renders the good rows despite a bad line', async () => {
    const app = createApp(makeRunsDir({ '2026-10-30.jsonl': NIGHT_WITH_BAD_LINE }));
    const res = await app.request('/digest/2026-10-30');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('solo-pack');
  });
});

describe('GET /api/digest/:night · bad line', () => {
  it('returns the good rows despite a bad line', async () => {
    const app = createApp(makeRunsDir({ '2026-10-30.jsonl': NIGHT_WITH_BAD_LINE }));
    const res = await app.request('/api/digest/2026-10-30');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([
      {
        job: 'solo-pack',
        owner: 'rook',
        runs: 1,
        retries: 0,
        lastStatus: 'ok',
        lastError: null,
        firstAt: '2026-10-28T01:00:00+01:00',
        lastAt: '2026-10-28T01:00:00+01:00',
      },
    ]);
  });
});
