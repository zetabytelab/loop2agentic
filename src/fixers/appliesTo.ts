import type { Report } from "../types.js";

/**
 * True when the report has no evidence either way (attempt the baseline fix),
 * or when a failing/partial check's id or evidence mentions one of the keywords.
 */
export function reportSuggests(report: Report, keywords: string[]): boolean {
  if (report.checks.length === 0) return true;

  return report.checks.some((check) => {
    if (check.status === "pass") return false;
    const haystack = `${check.id} ${check.evidence}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });
}
