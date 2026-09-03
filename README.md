# loop2agentic

**Run every agent-readiness grader, get one score, and loop your site to the top — with real code.**

The web now has two readers: people, and AI agents. In 2026 the big platforms each shipped a
0–100 "agent-readiness" score (Vercel's is-agentic, Cloudflare's, Ora's, and more) — but they
measure different things, weight differently, and every one just *scores* you. Almost none *fix*.

`loop2agentic` does both:

- **`scan`** — runs multiple graders and returns one **ARC Score** (Agent-Readiness Consensus) plus a per-grader gap map.
- **`fix`** — applies framework-aware codemods (sitemap, `llms.txt`, JSON-LD, trust pages, real 404s, markdown content negotiation, OpenAPI, an MCP server) and opens a PR for review.
- **`autopilot`** — after approval, loops apply → deploy → rescan until the score stops climbing.

## The ARC Score

Agent-readiness is fragmented across vendors. ARC normalizes every grader into one taxonomy
(Discovery · Access · Usability · Protocols · Commerce · Behavioral) and weights each check by
how many independent graders test it — so you get one number that cuts through vendor rubrics.

## Status

🏗 Early / work in progress. v1 targets Next.js (App Router) in **PR mode**: scan → apply
fixes → open a PR. Multi-scanner consensus, the live deploy loop, and a hosted ARC page are
on the roadmap.

## Why

Built from taking a real site from 68 → 90 on is-agentic by hand — every fix is now a codemod.
Readability is table stakes; being *callable* by an agent is the next tier.

## License

MIT
