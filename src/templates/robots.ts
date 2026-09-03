export function robotsTemplate(baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");

  return [
    'import type { MetadataRoute } from "next";',
    "",
    "export default function robots(): MetadataRoute.Robots {",
    "  return {",
    "    rules: {",
    '      userAgent: "*",',
    '      allow: "/",',
    "    },",
    `    sitemap: "${base}/sitemap.xml",`,
    "  };",
    "}",
    "",
  ].join("\n");
}
