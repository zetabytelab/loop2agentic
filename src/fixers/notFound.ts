import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { notFoundTemplate } from "../templates/notFound.js";

export const notFoundFixer: Fixer = {
  id: "not-found",
  category: "usability",
  description: "Generates app/not-found.tsx with recovery links, served with a real 404 status.",

  appliesTo(report) {
    return reportSuggests(report, ["404", "not found", "not-found"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const target = path.join(ctx.appDirRel, "not-found.tsx");
    if (ctx.hasFile(target)) {
      return { id: this.id, applied: false, files: [], message: `${target} already exists; skipped.` };
    }

    const content = notFoundTemplate(ctx.siteName);
    const result = ctx.writeFile(target, content);

    return {
      id: this.id,
      applied: result.written,
      files: result.written ? [target] : [],
      message: result.written ? `Wrote ${target}.` : `${target} already exists; skipped.`,
    };
  },
};
