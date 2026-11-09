--- id: 4
title: "Digest JSON: GET /api/digest/:night"
state: open
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: null
---

Source: plan.md § 2b

## Scope
- `GET /api/digest/:night` returns the same rows as JSON.
- Agents read this one; the page and the JSON must never disagree (ADR 0001).

## Done when
- The JSON for 2026-10-28 has the same jobs, in the same order, as the page.

## Blocked by
#1
