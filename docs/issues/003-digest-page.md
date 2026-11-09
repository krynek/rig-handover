--- id: 3
title: "Digest page: GET /digest/:night"
state: open
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: null
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
