# AGENTS.md

Instructions for AI coding agents working in this repository.

## What this project is

`loop2agentic` is a TypeScript CLI that scans a live website's agent-readiness and applies
framework-aware codemods to fix what it finds. v1 targets Next.js (App Router) in PR mode.
See `README.md` for the full pitch and usage, and `LOOP2AGENTIC_REPORT.md` (generated, not
committed) for the output of the last local `fix` run.

## Layout

- `src/index.ts` — the `commander` CLI (`scan`, `fix`).
- `src/loop.ts` — orchestration: scan → select fixers → apply → write report → optional PR.
- `src/types.ts` — `Report` / `Check` shapes shared across scanners and fixers.
- `src/scanners/` — the `Scanner` interface plus the `is-agentic` implementation.
- `src/targets/nextjs.ts` — App Router detection, `RepoCtx`, and the idempotent `writeFile` helper.
- `src/fixers/` — the `Fixer` interface plus one file per fixer (nine total).
- `src/templates/` — parameterized string templates for every file a fixer can write.
- `src/report.ts` — renders `LOOP2AGENTIC_REPORT.md`.

## Ground rules

- **Every fixer must be idempotent.** Before writing a file, check whether it (or its marker,
  for in-place edits like `json-ld`) already exists, and no-op if so. `RepoCtx.writeFile` already
  no-ops on an existing path — use it instead of raw `fs.writeFileSync` unless you are editing an
  existing file in place (see `src/fixers/jsonLd.ts` for that pattern).
- **`Fixer.appliesTo(report)` only receives the scan `Report`.** For fixers whose applicability is
  structural rather than evidence-based (e.g. `openapi` only makes sense when `app/api` exists),
  return `true` from `appliesTo` and gate inside `apply()` using `RepoCtx` instead.
- **Next.js conventions move fast.** This repo targets Next.js 16, where middleware was renamed
  `proxy.ts` (exported function `proxy`, not `middleware`). Verify current conventions against
  the official Next.js docs before changing anything under `src/templates/` or `src/fixers/`.
- **Keep generated code framework-idiomatic and dependency-light.** Templates should compile
  cleanly with the target repo's own `tsc`/`next build`/`eslint` — run the dogfood check below
  after touching any template.

## Verifying a change

```sh
npm run build            # tsc must be clean
```

Then dogfood against a scratch Next.js app (App Router, same layout as `create-next-app`):

```sh
npx create-next-app@latest /tmp/l2a-check --ts --app --no-src-dir --no-tailwind --eslint --yes
node dist/index.js fix --repo /tmp/l2a-check --url https://example.com
cd /tmp/l2a-check && npx tsc --noEmit && npx next build && npx eslint .
node /path/to/loop2agentic/dist/index.js fix --repo /tmp/l2a-check --url https://example.com  # must report 0 applied (idempotent)
```

All four checks (tsc, build, eslint, idempotent re-run) should pass before opening a PR that
touches a fixer or template.
