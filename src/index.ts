#!/usr/bin/env node
import { Command } from "commander";
import { z } from "zod";
import { runScan, runFix } from "./loop.js";

const urlSchema = z.string().url();

function parseUrl(value: string): string {
  const result = urlSchema.safeParse(value);
  if (!result.success) {
    console.error(`Invalid --url: ${value}`);
    process.exit(1);
  }
  return result.data;
}

const program = new Command();

program
  .name("loop2agentic")
  .description("Agent-readiness meta-scanner and auto-fixer for websites.")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan a live URL for agent-readiness and print the score + failing checks.")
  .requiredOption("--url <url>", "live URL to scan")
  .option("--json", "print raw JSON instead of a human-readable summary", false)
  .action(async (opts: { url: string; json: boolean }) => {
    const url = parseUrl(opts.url);
    const report = await runScan({ url });

    if (opts.json) {
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(`\nloop2agentic scan — ${url}`);
    console.log(`Score: ${report.score} / 100`);

    if (report.checks.length === 0) {
      console.log("No checks returned (scan may have failed or the target has no cached report).");
      return;
    }

    const failing = report.checks.filter((c) => c.status !== "pass");
    if (failing.length === 0) {
      console.log("No failing or partial checks.");
      return;
    }

    console.log(`\nFailing / partial checks (${failing.length}):`);
    for (const check of failing) {
      console.log(`  [${check.status.toUpperCase()}] (${check.category}) ${check.id}`);
      if (check.evidence) console.log(`      ${check.evidence}`);
    }
  });

program
  .command("fix")
  .description("Scan a repo's live URL, apply matching codemods, and write a before/after report.")
  .requiredOption("--repo <path>", "path to the target Next.js repo")
  .requiredOption("--url <url>", "live URL for the target repo")
  .option("--pr", "commit to a branch and open a PR via gh", false)
  .option("--mcp", "also scaffold the optional MCP endpoint fixer", false)
  .action(async (opts: { repo: string; url: string; pr: boolean; mcp: boolean }) => {
    const url = parseUrl(opts.url);
    const outcome = await runFix({ repo: opts.repo, url, pr: opts.pr, mcp: opts.mcp });

    const applied = outcome.fixResults.filter((f) => f.applied);
    console.log(`\nloop2agentic fix — ${url}`);
    console.log(`Baseline score: ${outcome.baseline.score} / 100`);
    console.log(`Applied ${applied.length} / ${outcome.fixResults.length} matching fixer(s).`);
    for (const fix of outcome.fixResults) {
      const mark = fix.applied ? "✓" : "-";
      console.log(`  ${mark} ${fix.id}: ${fix.message}`);
    }
    console.log(`\nReport written to ${outcome.reportPath}`);
    if (opts.pr) {
      console.log(outcome.prOpened ? "Pull request opened." : "PR was not opened (see warnings above).");
    }
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[loop2agentic] ${message}`);
  process.exit(1);
});
