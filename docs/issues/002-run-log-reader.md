--- id: 2
title: "Run log reader"
state: open
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: null
---

Source: plan.md § 1

## Scope
- Read `runs/<night>.jsonl` into one row per job: job, owner, runs, retries, last status, last error, first and last time.
- One JSON object per line (`at`, `job`, `status`: `ok | retry | fail`, `owner`, optional `error`).
- A line that doesn't parse is counted, never thrown. The night still renders.
- `owner` can be `null`. Keep the row; show the owner as `—`.
- Lives in `src/digest/`.

## Done when
- Reader tests pass on `runs/2026-10-28.jsonl` (5 jobs, 1 bad line).

## Blocked by
#1
