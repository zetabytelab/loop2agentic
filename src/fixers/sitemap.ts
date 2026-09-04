import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { crawlPageRoutes } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { sitemapTemplate } from "../templates/sitemap.js";

export const sitemapFixer: Fixer = {
  id: "sitemap",
  category: "discovery",
  description: "Generates app/sitemap.ts exporting MetadataRoute.Sitemap from crawled page routes.",

  appliesTo(report) {
    return reportSuggests(report, ["sitemap"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const target = path.join(ctx.appDirRel, "sitemap.ts");
    if (ctx.hasFile(target)) {
      return { id: this.id, applied: false, files: [], message: `${target} already exists; skipped.` };
    }

    const routes = crawlPageRoutes(ctx.appDir);
    const content = sitemapTemplate(ctx.baseUrl, routes);
    const result = ctx.writeFile(target, content);

    return {
      id: this.id,
      applied: result.written,
      files: result.written ? [target] : [],
      message: result.written
        ? `Wrote ${target} with ${routes.length || 1} route(s).`
        : `${target} already exists; skipped.`,
    };
  },
};
