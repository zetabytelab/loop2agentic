export function proxyTemplate(): string {
  return [
    'import { NextResponse } from "next/server";',
    'import type { NextRequest } from "next/server";',
    'import { getMarkdownForPath } from "./lib/agent-markdown";',
    "",
    "// Scoped to content paths only: skips /api, /_next, and anything with a file extension (static assets).",
    "export const config = {",
    '  matcher: ["/((?!api|_next|.*\\\\..*).*)"],',
    "};",
    "",
    "export function proxy(request: NextRequest) {",
    '  const accept = request.headers.get("accept") ?? "";',
    '  if (!accept.includes("text/markdown")) {',
    "    return NextResponse.next();",
    "  }",
    "",
    "  const markdown = getMarkdownForPath(request.nextUrl.pathname);",
    "  return new NextResponse(markdown, {",
    "    headers: {",
    '      "Content-Type": "text/markdown; charset=utf-8",',
    '      Vary: "Accept",',
    "    },",
    "  });",
    "}",
    "",
  ].join("\n");
}

export function agentMarkdownLibTemplate(siteName: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const fullSiteLine = "    `- [Full site](" + base + "${pathname})`,";
  const llmsTxtLine = '    "- [llms.txt](' + base + '/llms.txt)",';
  const sitemapLine = '    "- [Sitemap](' + base + '/sitemap.xml)",';
  const summaryLine = '    "This is a machine-readable summary of this page, served for ' + siteName + '.",';

  return [
    "/**",
    " * Best-effort markdown representation of a page, served to agents that send",
    ' * an "Accept: text/markdown" header (see ../proxy.ts). This is a scaffold:',
    " * wire it up to your real content source (CMS, MDX, database) for full fidelity.",
    " */",
    "export function getMarkdownForPath(pathname: string): string {",
    '  const title = pathname === "/" ? "Home" : pathname.replace(/^\\//, "");',
    "",
    "  return [",
    "    `# ${title}`,",
    '    "",',
    summaryLine,
    '    "",',
    fullSiteLine,
    llmsTxtLine,
    sitemapLine,
    '    "",',
    '  ].join("\\n");',
    "}",
    "",
  ].join("\n");
}
