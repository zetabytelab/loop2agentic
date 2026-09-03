import path from "node:path";
import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import { isAgenticScanner } from "./scanners/isAgentic.js";
import { createRepoCtx } from "./targets/nextjs.js";
import type { RepoCtx } from "./targets/nextjs.js";
import type { Fixer, FixResult } from "./fixers/Fixer.js";
import { sitemapFixer } from "./fixers/sitemap.js";
import { robotsFixer } from "./fixers/robots.js";
import { llmsTxtFixer } from "./fixers/llmsTxt.js";
import { jsonLdFixer } from "./fixers/jsonLd.js";
import { trustPagesFixer } from "./fixers/trustPages.js";
import { notFoundFixer } from "./fixers/notFound.js";
import { markdownNegotiationFixer } from "./fixers/markdownNegotiation.js";
import { openapiFixer } from "./fixers/openapi.js";
import { mcpFixer } from "./fixers/mcp.js";
import { renderReportMarkdown } from "./report.js";
import type { Report } from "./types.js";

const CORE_FIXERS: Fixer[] = [
  sitemapFixer,
  robotsFixer,
  llmsTxtFixer,
  jsonLdFixer,
  trustPagesFixer,
  notFoundFixer,
  markdownNegotiationFixer,
  openapiFixer,
];

export const REPORT_FILENAME = "LOOP2AGENTIC_REPORT.md";

export interface ScanOptions {
  url: string;
}

export async function runScan(options: ScanOptions): Promise<Report> {
  return isAgenticScanner.scan(options.url);
}

export interface FixOptions {
  repo: string;
  url: string;
  pr: boolean;
  mcp?: boolean;
}

export interface FixOutcome {
  ctx: RepoCtx;
  baseline: Report;
  fixResults: FixResult[];
  reportPath: string;
  prOpened: boolean;
}

export async function runFix(options: FixOptions): Promise<FixOutcome> {
  const repoRoot = path.resolve(options.repo);
  const ctx = createRepoCtx(repoRoot, options.url);
  const baseline = await runScan({ url: options.url });

  const fixers = options.mcp ? [...CORE_FIXERS, mcpFixer] : CORE_FIXERS;
  const applicable = fixers.filter((fixer) => fixer.appliesTo(baseline));

  const fixResults: FixResult[] = [];
  for (const fixer of applicable) {
    try {
      fixResults.push(await fixer.apply(ctx));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fixResults.push({ id: fixer.id, applied: false, files: [], message: `Error: ${message}` });
    }
  }

  const markdown = renderReportMarkdown({
    siteName: ctx.siteName,
    url: options.url,
    baseline,
    fixResults,
  });
  writeFileSync(path.join(repoRoot, REPORT_FILENAME), markdown, "utf8");

  let prOpened = false;
  if (options.pr) {
    prOpened = await openPullRequest(ctx, fixResults);
  }

  return { ctx, baseline, fixResults, reportPath: REPORT_FILENAME, prOpened };
}

function run(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr?.toString().trim() || error.message));
        return;
      }
      resolve(stdout.toString());
    });
  });
}

async function openPullRequest(ctx: RepoCtx, fixResults: FixResult[]): Promise<boolean> {
  const branch = "loop2agentic/fixes";
  const applied = fixResults.filter((f) => f.applied);

  if (applied.length === 0) {
    console.warn("[loop2agentic] no fixes were applied; skipping commit and PR.");
    return false;
  }

  const summary = applied.map((f) => `- ${f.id}: ${f.message}`).join("\n");

  try {
    await run("git", ["checkout", "-B", branch], ctx.repoRoot);
    await run("git", ["add", "-A"], ctx.repoRoot);
    await run("git", ["commit", "-m", `loop2agentic: apply agent-readiness fixes\n\n${summary}`], ctx.repoRoot);
    await run("git", ["push", "-u", "origin", branch], ctx.repoRoot);
    await run(
      "gh",
      [
        "pr",
        "create",
        "--title",
        "loop2agentic: agent-readiness fixes",
        "--body",
        `Applied fixes:\n\n${summary}\n\nSee ${REPORT_FILENAME} for the full before/after report.`,
      ],
      ctx.repoRoot,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[loop2agentic] could not open a PR (${message}). Changes are committed locally on "${branch}".`);
    return false;
  }
}
