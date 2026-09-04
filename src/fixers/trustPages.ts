import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { trustPageTemplate, type TrustPageKind } from "../templates/trustPage.js";

const KINDS: TrustPageKind[] = ["about", "contact", "privacy"];

export const trustPagesFixer: Fixer = {
  id: "trust-pages",
  category: "usability",
  description: "Generates app/about, app/contact, and app/privacy pages with real placeholder content.",

  appliesTo(report) {
    return reportSuggests(report, ["about", "contact", "privacy", "trust"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const files: string[] = [];
    const skipped: string[] = [];

    for (const kind of KINDS) {
      const target = path.join(ctx.appDirRel, kind, "page.tsx");
      if (ctx.hasFile(target)) {
        skipped.push(target);
        continue;
      }
      const content = trustPageTemplate(kind, ctx.siteName, ctx.baseUrl);
      const result = ctx.writeFile(target, content);
      if (result.written) files.push(target);
    }

    const applied = files.length > 0;
    const parts: string[] = [];
    if (files.length) parts.push(`Wrote ${files.join(", ")}.`);
    if (skipped.length) parts.push(`${skipped.join(", ")} already existed; skipped.`);

    return {
      id: this.id,
      applied,
      files,
      message: parts.join(" ") || "No trust pages needed writing.",
    };
  },
};
