import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { llmsTxtTemplate } from "../templates/llmsTxt.js";

export const llmsTxtFixer: Fixer = {
  id: "llms-txt",
  category: "discovery",
  description: "Generates public/llms.txt with a site summary and key links for agents.",

  appliesTo(report) {
    return reportSuggests(report, ["llms.txt", "llms-txt", "llm", "agent instruction", "when-to-use", "when to use"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const target = path.join(ctx.publicDirRel, "llms.txt");
    if (ctx.hasFile(target)) {
      return { id: this.id, applied: false, files: [], message: `${target} already exists; skipped.` };
    }

    const content = llmsTxtTemplate(ctx.siteName, ctx.baseUrl);
    const result = ctx.writeFile(target, content);

    return {
      id: this.id,
      applied: result.written,
      files: result.written ? [target] : [],
      message: result.written ? `Wrote ${target}.` : `${target} already exists; skipped.`,
    };
  },
};
