import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { RigConfig } from '../src/config.js';
import { readNight } from '../src/digest/types.js';

const dirs: string[] = [];

function makeRunsDir(files: Record<string, string>): RigConfig {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  dirs.push(runsDir);
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(runsDir, name), body);
  }
  return { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir };
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

// readNight lands with issue #2; until then it throws 'not implemented', and the tests
// that need it skip themselves (no `todo` bodies lost — they run for real once #2 is in).
const readNightReady = (() => {
  try {
    readNight(tmpdir(), '1900-01-01');
    return true;
  } catch (e) {
    return !(e instanceof Error && e.message === 'not implemented');
  }
})();

describe('GET /api/digest/:night', () => {
  it('404s with JSON for a night with no file', async () => {
    const app = createApp(makeRunsDir({}));
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(await res.json()).toEqual({ error: 'night not found' });
  });

  it('404s a night that is not a date', async () => {
    const app = createApp(makeRunsDir({}));
    const res = await app.request('/api/digest/not-a-date');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'night not found' });
  });

  it.skipIf(!readNightReady)(
    'returns the rows as JSON, sorted by job',
    async () => {
      const app = createApp(
        makeRunsDir({
          '2026-10-28.jsonl': [
            '{"at":"2026-10-28T02:00:00+02:00","job":"zeta-pack","status":"ok","owner":"mira"}',
            '{"at":"2026-10-28T03:00:00+02:00","job":"alpha-pack","status":"retry","owner":null}',
            '{"at":"2026-10-28T04:00:00+02:00","job":"alpha-pack","status":"fail","owner":null,"error":"boom"}',
            '',
          ].join('\n'),
        }),
      );
      const res = await app.request('/api/digest/2026-10-28');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');
      expect(await res.json()).toEqual([
        {
          job: 'alpha-pack',
          owner: null,
          runs: 2,
          retries: 1,
          lastStatus: 'fail',
          lastError: 'boom',
          firstAt: '2026-10-28T03:00:00+02:00',
          lastAt: '2026-10-28T04:00:00+02:00',
        },
        {
          job: 'zeta-pack',
          owner: 'mira',
          runs: 1,
          retries: 0,
          lastStatus: 'ok',
          lastError: null,
          firstAt: '2026-10-28T02:00:00+02:00',
          lastAt: '2026-10-28T02:00:00+02:00',
        },
      ]);
    },
  );

  it.skipIf(!readNightReady)('returns an empty list for an empty night', async () => {
    const app = createApp(makeRunsDir({ '2026-10-29.jsonl': '' }));
    const res = await app.request('/api/digest/2026-10-29');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});
