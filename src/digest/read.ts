import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, RunStatus } from './types.js';

const statuses: readonly RunStatus[] = ['ok', 'retry', 'fail'];

type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error: string | null;
};

export class NightNotFound extends Error {
  constructor(night: string) {
    super(`night not found: ${night}`);
    this.name = 'NightNotFound';
  }
}

export type NightResult = {
  rows: DigestRow[];
  badLines: number;
};

function isRunLine(value: unknown): value is RunLine {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.at === 'string' &&
    !Number.isNaN(Date.parse(v.at)) &&
    typeof v.job === 'string' &&
    typeof v.status === 'string' &&
    (statuses as readonly string[]).includes(v.status) &&
    (v.owner === null || typeof v.owner === 'string') &&
    (v.error === null || v.error === undefined || typeof v.error === 'string')
  );
}

export function readNightResult(runsDir: string, night: string): NightResult {
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch {
    throw new NightNotFound(night);
  }

  const jobs = new Map<string, RunLine[]>();
  let badLines = 0;

  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      badLines++;
      continue;
    }
    if (!isRunLine(parsed)) {
      badLines++;
      continue;
    }
    const lines = jobs.get(parsed.job) ?? [];
    lines.push({ ...parsed, error: parsed.error ?? null });
    jobs.set(parsed.job, lines);
  }

  const rows = [...jobs.values()].map((lines): DigestRow => {
    const sorted = [...lines].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    let lastError: string | null = null;
    for (const line of sorted) {
      if (line.error !== null) lastError = line.error;
    }
    return {
      job: last.job,
      owner: last.owner,
      runs: lines.length,
      retries: lines.filter((line) => line.status === 'retry').length,
      lastStatus: last.status,
      lastError,
      firstAt: first.at,
      lastAt: last.at,
    };
  });

  rows.sort((a, b) => a.job.localeCompare(b.job));

  return { rows, badLines };
}

export function readNight(runsDir: string, night: string): DigestRow[] {
  return readNightResult(runsDir, night).rows;
}
