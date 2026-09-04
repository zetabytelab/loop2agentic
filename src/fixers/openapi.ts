import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { openapiRouteTemplate } from "../templates/openapi.js";

export const openapiFixer: Fixer = {
  id: "openapi",
  category: "protocols",
  description: "Generates app/openapi.json/route.ts with a minimal OpenAPI 3.1 document, when app/api exists.",

  appliesTo() {
    // Applicability is structural (does app/api exist?), decided in apply() via ctx.hasApiDir,
    // not evidence-based — a scanner has no way to know about an OpenAPI doc that doesn't exist yet.
    return true;
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    if (!ctx.hasApiDir) {
      return {
        id: this.id,
        applied: false,
        files: [],
        message: "not-applicable: no app/api directory found.",
      };
    }

    const target = path.join(ctx.appDirRel, "openapi.json", "route.ts");
    if (ctx.hasFile(target)) {
      return { id: this.id, applied: false, files: [], message: `${target} already exists; skipped.` };
    }

    const content = openapiRouteTemplate(ctx.siteName, ctx.baseUrl);
    const result = ctx.writeFile(target, content);

    return {
      id: this.id,
      applied: result.written,
      files: result.written ? [target] : [],
      message: result.written ? `Wrote ${target}.` : `${target} already exists; skipped.`,
    };
  },
};
