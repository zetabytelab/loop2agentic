# loop2agentic

**Run every agent-readiness grader, get one score, and loop your site to the top — with real code.**

The web now has two readers: people, and AI agents. In 2026 the big platforms each shipped a
0–100 "agent-readiness" score (Vercel's is-agentic, Cloudflare's, Ora's, and more) — but they
measure different things, weight differently, and every one just *scores* you. Almost none *fix*.

`loop2agentic` does both:

- **`scan`** — runs multiple graders and returns one **ARC Score** (Agent-Readiness Consensus) plus a per-grader gap map.
- **`fix`** — applies framework-aware codemods (sitemap, `llms.txt`, JSON-LD, trust pages, real 404s, markdown content negotiation, OpenAPI, an MCP server) and opens a PR for review.
- **`autopilot`** *(planned)* — after approval, loops apply → deploy → rescan until the score stops climbing.

## The ARC Score

Agent-readiness is fragmented across vendors. ARC normalizes every grader into one taxonomy
(Discovery · Access · Usability · Protocols · Commerce · Behavioral) and weights each check by
how many independent graders test it — so you get one number that cuts through vendor rubrics.

## Status

🏗 v1 is here and targets Next.js (App Router) in **PR mode**: scan → apply fixes → open a PR.
Multi-scanner consensus, the `autopilot` deploy loop, and a hosted ARC page are on the roadmap —
v1 runs a single scanner ([`is-agentic`](https://is-agentic.com)) and nine framework-aware fixers.

## Install

```sh
npm install -g loop2agentic
# or run without installing:
npx loop2agentic scan --url https://example.com
```

Requires Node.js >= 20.

## Usage

### `scan` — see where a live site stands

```sh
loop2agentic scan --url https://example.com
loop2agentic scan --url https://example.com --json   # machine-readable Report
```

Prints the ARC-style score plus every failing or partial check found by the underlying scanner.

### `fix` — apply codemods to a Next.js App Router repo

```sh
loop2agentic fix --repo ./my-nextjs-app --url https://my-nextjs-app.example.com
```

This scans `--url`, figures out which of the nine fixers below apply, writes the matching files
directly into `--repo`, and drops a `LOOP2AGENTIC_REPORT.md` with the baseline score and what
changed. Every fixer is idempotent — a file or marker that already exists is left untouched, so
running `fix` again is a no-op until something regresses.

```sh
loop2agentic fix --repo ./my-nextjs-app --url https://my-nextjs-app.example.com --pr
```

Add `--pr` to also commit the changes to a `loop2agentic/fixes` branch, push it, and open a pull
request via the `gh` CLI (falls back to a local commit with a clear message if `gh`/push access
isn't available).

```sh
loop2agentic fix --repo ./my-nextjs-app --url https://my-nextjs-app.example.com --mcp
```

Add `--mcp` to also scaffold the optional MCP JSON-RPC endpoint (see below); it isn't applied by
default since it adds a `zod` dependency to the target repo.

### The nine fixers

| Fixer | Writes | Category |
| --- | --- | --- |
| `sitemap` | `app/sitemap.ts` (crawls `app/` for routes) | Discovery |
| `robots` | `app/robots.ts` | Discovery |
| `llms-txt` | `public/llms.txt` | Discovery |
| `json-ld` | Injects Organization + WebSite JSON-LD into layout/page | Discovery |
| `trust-pages` | `app/about`, `app/contact`, `app/privacy` | Usability |
| `not-found` | `app/not-found.tsx` (real 404s, recovery links) | Usability |
| `markdown-negotiation` | `proxy.ts` + `lib/agent-markdown.ts` (serves `text/markdown` on `Accept: text/markdown`) | Access |
| `openapi` | `app/openapi.json/route.ts` — only when `app/api` exists | Protocols |
| `mcp` | `app/mcp/route.ts` — optional, behind `--mcp` | Protocols |

## Why

Built from taking a real site from 68 → 90 on is-agentic by hand — every fix is now a codemod.
Readability is table stakes; being *callable* by an agent is the next tier.

## License

MIT
