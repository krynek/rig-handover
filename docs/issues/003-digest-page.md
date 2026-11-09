--- id: 3
title: "Digest page: GET /digest/:night"
state: closed
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: 2026-11-09T11:05:00+01:00
---

Source: plan.md § 2a

## Scope
- `GET /digest/:night` renders the rows with the usual layout: one table, sorted by job.
- Retries of 3 or more and any `fail` marked.
- A night with no file returns 404; an empty file renders "nothing ran".

## Done when
- `/digest/2026-10-28` renders locally.

## Blocked by
#1

## Closing comment

done: GET /digest/:night renders the digest table sorted by job with retry>=3 and fail marked; 404 for no file, "nothing ran" for empty
worker: opencode · nask-glm/glm-5-2 · medium
commit: 6dd15c2
