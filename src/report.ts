import type { Report } from "./types.js";
import type { FixResult } from "./fixers/Fixer.js";

export interface ReportInput {
  siteName: string;
  url: string;
  baseline: Report;
  fixResults: FixResult[];
  generatedAt?: Date;
}

export function renderReportMarkdown(input: ReportInput): string {
  const generatedAt = input.generatedAt ?? new Date();
  const applied = input.fixResults.filter((f) => f.applied);
  const skipped = input.fixResults.filter((f) => !f.applied);

  const lines: string[] = [];
  lines.push(`# loop2agentic report — ${input.siteName}`);
  lines.push("");
  lines.push(`Generated: ${generatedAt.toISOString()}`);
  lines.push(`Target: ${input.url}`);
  lines.push("");
  lines.push("## Baseline scan");
  lines.push("");

  if (input.baseline.checks.length === 0) {
    lines.push(`Score: ${input.baseline.score} (scan returned no checks; fixers ran best-effort on baseline hygiene).`);
  } else {
    lines.push(`Score: ${input.baseline.score} / 100`);
    lines.push("");
    lines.push("| Check | Status | Category | Evidence |");
    lines.push("| --- | --- | --- | --- |");
    for (const check of input.baseline.checks) {
      const evidence = check.evidence.replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| ${check.id} | ${check.status} | ${check.category} | ${evidence} |`);
    }
  }
  lines.push("");

  lines.push("## Fixes applied");
  lines.push("");
  if (applied.length === 0) {
    lines.push("No fixes were applied.");
  } else {
    for (const fix of applied) {
      lines.push(`- **${fix.id}** — ${fix.message}`);
    }
  }
  lines.push("");

  if (skipped.length > 0) {
    lines.push("## Skipped / not applicable");
    lines.push("");
    for (const fix of skipped) {
      lines.push(`- **${fix.id}** — ${fix.message}`);
    }
    lines.push("");
  }

  lines.push("## Next steps");
  lines.push("");
  lines.push(`Rescan to see the after score: \`loop2agentic scan --url ${input.url}\``);
  lines.push("");

  return lines.join("\n");
}
