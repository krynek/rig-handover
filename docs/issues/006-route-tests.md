--- id: 6
title: "Route tests for 2a and 2b"
state: closed
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: 2026-11-09T11:15:00+01:00
---

Source: plan.md § 2d

## Scope
- Route tests for the digest page (2a) and digest JSON (2b): 200, 404 for a night with no file, the empty night, a night with a bad line.
- Use a temp runs dir; `runs/` is read-only.

## Done when
- `pnpm test` is green with the new tests.

## Blocked by
#1, #3, #4

## Closing comment

done: route tests for digest page and JSON: 200, 404, empty night, bad-line night, all on a temp runs dir
worker: opencode · nask-glm/glm-5-2 · medium
commit: 23a8609
