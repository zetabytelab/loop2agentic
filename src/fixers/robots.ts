import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { robotsTemplate } from "../templates/robots.js";

export const robotsFixer: Fixer = {
  id: "robots",
  category: "discovery",
  description: "Generates app/robots.ts that allows all crawlers and references /sitemap.xml.",

  appliesTo(report) {
    return reportSuggests(report, ["robots"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const target = path.join(ctx.appDirRel, "robots.ts");
    if (ctx.hasFile(target)) {
      return { id: this.id, applied: false, files: [], message: `${target} already exists; skipped.` };
    }

    const content = robotsTemplate(ctx.baseUrl);
    const result = ctx.writeFile(target, content);

    return {
      id: this.id,
      applied: result.written,
      files: result.written ? [target] : [],
      message: result.written ? `Wrote ${target}.` : `${target} already exists; skipped.`,
    };
  },
};
