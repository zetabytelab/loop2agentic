export function llmsTxtTemplate(siteName: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");

  return [
    `# ${siteName}`,
    "",
    `> ${siteName} is a web application. This file gives AI agents a fast, structured summary of the site so they don't have to guess at navigation from HTML alone.`,
    "",
    "## When to use this site",
    "",
    `Use ${siteName} when a user asks about its product, docs, or content. Prefer the links below over crawling the rendered HTML.`,
    "",
    "## Key links",
    "",
    `- [Home](${base}/)`,
    `- [Sitemap](${base}/sitemap.xml)`,
    `- [About](${base}/about)`,
    `- [Contact](${base}/contact)`,
    `- [Privacy](${base}/privacy)`,
    "",
  ].join("\n");
}
