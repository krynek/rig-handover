import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { NightNotFound, readNight, readNightResult } from '../src/digest/types.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function tempNight(night: string, text: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'rig-read-'));
  tempDirs.push(dir);
  writeFileSync(join(dir, `${night}.jsonl`), text);
  return dir;
}

describe('run log reader', () => {
  it('reads the fixture night into one row per job', () => {
    const rows = readNight('runs', '2026-10-28');
    expect(rows.map((row) => row.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
  });

  it('keeps a null owner on the row', () => {
    const row = readNight('runs', '2026-10-28').find((r) => r.job === 'digest/render');
    expect(row?.owner).toBeNull();
  });

  it('counts runs and retries per job', () => {
    const rows = readNight('runs', '2026-10-28');
    const byJob = new Map(rows.map((row) => [row.job, row]));
    expect(byJob.get('lane/sync')).toMatchObject({ runs: 8, retries: 1 });
    expect(byJob.get('fixtures/refresh')).toMatchObject({ runs: 4, retries: 3 });
  });

  it('takes lastStatus and lastError from the right lines', () => {
    const rows = readNight('runs', '2026-10-28');
    const byJob = new Map(rows.map((row) => [row.job, row]));
    expect(byJob.get('lane/sync')).toMatchObject({
      lastStatus: 'ok',
      lastError: 'lock held',
      firstAt: '2026-10-28T23:00:06+01:00',
      lastAt: '2026-10-29T05:00:04+01:00',
    });
    expect(byJob.get('notes/backup')).toMatchObject({
      lastStatus: 'fail',
      lastError: 'quota exceeded',
      firstAt: '2026-10-29T04:00:01+01:00',
      lastAt: '2026-10-29T04:00:01+01:00',
    });
    expect(byJob.get('rig/rotate-logs')).toMatchObject({ lastStatus: 'ok', lastError: null });
  });

  it('counts the bad line but still returns the five jobs', () => {
    const result = readNightResult('runs', '2026-10-28');
    expect(result.badLines).toBe(1);
    expect(result.rows).toHaveLength(5);
  });

  it('counts bad lines and never throws', () => {
    const dir = tempNight(
      '2099-01-01',
      '{"at":"2099-01-01T01:00:00+01:00","job":"a","status":"ok","owner":"rook"}\n' +
        'not json at all\n' +
        '{"at":"2099-01-01T02:00:00+01:00","job":"a","status":"fail","owner":"rook","error":"boom"}\n' +
        '{"at":"2099-01-01T03:00:00+01:00","status":"ok","owner":"rook"}\n',
    );
    const result = readNightResult(dir, '2099-01-01');
    expect(result.badLines).toBe(2);
    expect(result.rows).toEqual([
      {
        job: 'a',
        owner: 'rook',
        runs: 2,
        retries: 0,
        lastStatus: 'fail',
        lastError: 'boom',
        firstAt: '2099-01-01T01:00:00+01:00',
        lastAt: '2099-01-01T02:00:00+01:00',
      },
    ]);
  });

  it('returns no rows for an empty file', () => {
    const dir = tempNight('2099-01-02', '');
    const result = readNightResult(dir, '2099-01-02');
    expect(result).toEqual({ rows: [], badLines: 0 });
  });

  it('throws NightNotFound when the night has no file', () => {
    const dir = tempNight('2099-01-03', '');
    expect(() => readNight(dir, '2099-01-04')).toThrow(NightNotFound);
  });
});
