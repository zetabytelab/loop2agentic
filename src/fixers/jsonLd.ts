import path from "node:path";
import { writeFileSync } from "node:fs";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { jsonLdScriptTag } from "../templates/jsonLd.js";

const MARKER = "application/ld+json";

function injectAfterOpeningTag(content: string, tagName: string, snippet: string): string | null {
  const match = content.match(new RegExp(`<${tagName}[^>]*>`));
  if (!match || match.index === undefined) return null;
  const index = match.index + match[0].length;
  return `${content.slice(0, index)}\n${snippet}${content.slice(index)}`;
}

export const jsonLdFixer: Fixer = {
  id: "json-ld",
  category: "discovery",
  description: "Injects Organization + WebSite JSON-LD structured data into the root layout or home page.",

  appliesTo(report) {
    return reportSuggests(report, ["json-ld", "structured data", "schema.org", "schema"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const layoutCandidates = ["layout.tsx", "layout.ts"].map((f) => path.join(ctx.appDirRel, f));
    const pageCandidates = ["page.tsx", "page.ts"].map((f) => path.join(ctx.appDirRel, f));
    const allCandidates = [...layoutCandidates, ...pageCandidates];

    for (const rel of allCandidates) {
      if (ctx.fileContains(rel, MARKER)) {
        return { id: this.id, applied: false, files: [], message: `${rel} already has JSON-LD; skipped.` };
      }
    }

    const description = `${ctx.siteName} on the web.`;
    const snippet = jsonLdScriptTag(ctx.siteName, ctx.baseUrl, description);

    for (const rel of layoutCandidates) {
      const content = ctx.readFile(rel);
      if (content === null) continue;
      const updated = injectAfterOpeningTag(content, "body", snippet);
      if (updated === null) continue;
      writeFileSync(path.join(ctx.repoRoot, rel), updated, "utf8");
      return { id: this.id, applied: true, files: [rel], message: `Injected JSON-LD into ${rel}.` };
    }

    for (const rel of pageCandidates) {
      const content = ctx.readFile(rel);
      if (content === null) continue;
      const updated = injectAfterOpeningTag(content, "main", snippet);
      if (updated === null) continue;
      writeFileSync(path.join(ctx.repoRoot, rel), updated, "utf8");
      return { id: this.id, applied: true, files: [rel], message: `Injected JSON-LD into ${rel}.` };
    }

    return {
      id: this.id,
      applied: false,
      files: [],
      message: "Could not find a <body> tag in the root layout or a <main> tag in the home page; skipped json-ld injection.",
    };
  },
};
