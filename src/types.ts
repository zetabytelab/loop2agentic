export type CheckStatus = "pass" | "fail" | "partial";

export interface Check {
  id: string;
  status: CheckStatus;
  category: string;
  evidence: string;
}

export interface Report {
  score: number;
  checks: Check[];
}

export function emptyReport(): Report {
  return { score: 0, checks: [] };
}
