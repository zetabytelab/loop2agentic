import { execFile } from "node:child_process";
import type { Scanner } from "./Scanner.js";
import type { Check, CheckStatus, Report } from "../types.js";
import { emptyReport } from "../types.js";

const SCAN_TIMEOUT_MS = 90_000;

interface IsAgenticIssue {
  result?: string;
  tier?: string;
  name?: string;
  details?: string;
  recommendation?: string;
}

interface IsAgenticJson {
  score?: number;
  issues?: IsAgenticIssue[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function statusFromResult(result: string | undefined): CheckStatus {
  if (result === "failed") return "fail";
  if (result === "partial") return "partial";
  return "partial";
}

function parseJsonOutput(stdout: string): Report | null {
  let parsed: IsAgenticJson;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return null;
  }

  if (typeof parsed.score !== "number" || !Array.isArray(parsed.issues)) {
    return null;
  }

  const checks: Check[] = parsed.issues.map((issue) => ({
    id: slugify(issue.name ?? "unknown-check"),
    status: statusFromResult(issue.result),
    category: issue.tier ?? "general",
    evidence: issue.details ?? issue.recommendation ?? "",
  }));

  return { score: parsed.score, checks };
}

const TEXT_SCORE_RE = /(\d{1,3}(?:\.\d+)?)\s*\/\s*100/;
const TEXT_FINDING_RE = /^\d+\.\s+(FAIL|PARTIAL)\s*\S*\s+([A-Z]+)\s+(.+)$/;

function parseTextOutput(stdout: string): Report | null {
  const scoreMatch = stdout.match(TEXT_SCORE_RE);
  if (!scoreMatch) return null;

  const score = Number(scoreMatch[1]);
  const checks: Check[] = [];
  const lines = stdout.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(TEXT_FINDING_RE);
    if (!match) continue;
    const [, result, tier, name] = match;
    checks.push({
      id: slugify(name),
      status: result === "FAIL" ? "fail" : "partial",
      category: tier.toLowerCase(),
      evidence: name,
    });
  }

  return { score, checks };
}

export const isAgenticScanner: Scanner = {
  id: "is-agentic",

  async scan(url: string): Promise<Report> {
    const stdout = await new Promise<string>((resolve, reject) => {
      execFile(
        "npx",
        ["-y", "is-agentic", url, "--json"],
        { timeout: SCAN_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
        (error, out) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(out);
        },
      );
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[loop2agentic] is-agentic scan failed: ${message}`);
      return null;
    });

    if (stdout === null) {
      return emptyReport();
    }

    const jsonReport = parseJsonOutput(stdout);
    if (jsonReport) return jsonReport;

    const textReport = parseTextOutput(stdout);
    if (textReport) return textReport;

    console.warn("[loop2agentic] could not parse is-agentic output; continuing with an empty report");
    return emptyReport();
  },
};
