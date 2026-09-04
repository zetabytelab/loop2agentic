import type { Report } from "../types.js";
import type { RepoCtx } from "../targets/nextjs.js";

export interface FixResult {
  id: string;
  applied: boolean;
  files: string[];
  message: string;
}

export interface Fixer {
  id: string;
  category: string;
  description: string;
  appliesTo(report: Report): boolean;
  apply(ctx: RepoCtx): Promise<FixResult>;
}
