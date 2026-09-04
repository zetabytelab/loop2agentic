import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { reportSuggests } from "./appliesTo.js";
import { agentMarkdownLibTemplate, proxyTemplate } from "../templates/proxy.js";

export const markdownNegotiationFixer: Fixer = {
  id: "markdown-negotiation",
  category: "access",
  description: "Generates proxy.ts + lib/agent-markdown.ts to serve text/markdown for content paths on request.",

  appliesTo(report) {
    return reportSuggests(report, ["markdown", "content negotiation", "text/markdown"]);
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const projectRootRel = path.dirname(ctx.appDirRel);
    const proxyTarget = path.join(projectRootRel, "proxy.ts");
    const libTarget = path.join(projectRootRel, "lib", "agent-markdown.ts");

    const files: string[] = [];
    const skipped: string[] = [];

    const proxyExists = ctx.hasFile(proxyTarget);
    if (proxyExists) {
      skipped.push(proxyTarget);
    } else {
      const result = ctx.writeFile(proxyTarget, proxyTemplate());
      if (result.written) files.push(proxyTarget);
    }

    const libExists = ctx.hasFile(libTarget);
    if (libExists) {
      skipped.push(libTarget);
    } else {
      const result = ctx.writeFile(libTarget, agentMarkdownLibTemplate(ctx.siteName, ctx.baseUrl));
      if (result.written) files.push(libTarget);
    }

    const parts: string[] = [];
    if (files.length) parts.push(`Wrote ${files.join(", ")}.`);
    if (skipped.length) parts.push(`${skipped.join(", ")} already existed; skipped.`);

    return {
      id: this.id,
      applied: files.length > 0,
      files,
      message: parts.join(" ") || "No files needed writing.",
    };
  },
};
