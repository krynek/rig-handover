--- id: 4
title: "Digest JSON: GET /api/digest/:night"
state: closed
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: 2026-11-09T11:05:00+01:00
---

Source: plan.md § 2b

## Scope
- `GET /api/digest/:night` returns the same rows as JSON.
- Agents read this one; the page and the JSON must never disagree (ADR 0001).

## Done when
- The JSON for 2026-10-28 has the same jobs, in the same order, as the page.

## Blocked by
#1

## Closing comment

done: GET /api/digest/:night returns the same rows as JSON, sorted by job; 404 for missing night, [] for empty
worker: opencode · nask-glm/glm-5-2 · medium
commit: 6f79631
