--- id: 1
title: "src/digest/types.ts: DigestRow + readNight signature"
state: closed
labels: [plan:morning-digest]
created: 2026-11-09T10:00:00+01:00
closed: 2026-11-09T10:44:00+01:00
---

Source: plan.md § 1

## Scope
- Commit `src/digest/types.ts` **first**, so every part of section 2 can start against it.
- Define the `DigestRow` type and the `readNight(runsDir, night)` signature (exported).
- Types only — no implementation in this issue.

## Done when
- `src/digest/types.ts` is in the repo with `DigestRow` and the `readNight` signature.
- `pnpm typecheck` is green.

## Blocked by
— none. This goes first.

## Closing comment

done: src/digest/types.ts with DigestRow and the readNight signature
worker: opencode · nask-glm/glm-5-2 · medium
commit: d65def0
