import path from "node:path";
import type { Fixer, FixResult } from "./Fixer.js";
import type { RepoCtx } from "../targets/nextjs.js";
import { mcpRouteTemplate } from "../templates/mcp.js";

/**
 * Optional/flagged: only included in the fixer list when --mcp is passed (see loop.ts).
 * The generated route imports `zod`, so the target repo needs it as a dependency.
 */
export const mcpFixer: Fixer = {
  id: "mcp",
  category: "protocols",
  description: "Scaffolds a minimal read-only MCP JSON-RPC endpoint at app/mcp/route.ts (requires zod).",

  appliesTo() {
    // Inclusion is already gated behind the --mcp flag in loop.ts; once included, always apply.
    return true;
  },

  async apply(ctx: RepoCtx): Promise<FixResult> {
    const target = path.join(ctx.appDirRel, "mcp", "route.ts");
    if (ctx.hasFile(target)) {
      return { id: this.id, applied: false, files: [], message: `${target} already exists; skipped.` };
    }

    const content = mcpRouteTemplate(ctx.siteName);
    const result = ctx.writeFile(target, content);

    return {
      id: this.id,
      applied: result.written,
      files: result.written ? [target] : [],
      message: result.written
        ? `Wrote ${target}. This route imports "zod" — run npm install zod in the target repo.`
        : `${target} already exists; skipped.`,
    };
  },
};
