import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { NightNotFound, readNightResult } from './digest/types.js';
import { lastBeat, type Beat } from './heartbeat.js';

export type NightSummary = {
  night: string;
  ok: number | null;
  retry: number | null;
  fail: number | null;
};

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightSummary[];
};

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

// ok / retry / fail = jobs whose last status is ok / retry / fail. A night that
// vanishes between listing and reading keeps its row, counts as `—`.
function summarizeNight(runsDir: string, night: string): NightSummary {
  try {
    const { rows } = readNightResult(runsDir, night);
    return {
      night,
      ok: rows.filter((r) => r.lastStatus === 'ok').length,
      retry: rows.filter((r) => r.lastStatus === 'retry').length,
      fail: rows.filter((r) => r.lastStatus === 'fail').length,
    };
  } catch (e) {
    if (e instanceof NightNotFound) return { night, ok: null, retry: null, fail: null };
    throw e;
  }
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((night) => summarizeNight(config.runsDir, night)),
  };
}
