export function sitemapTemplate(baseUrl: string, routes: string[]): string {
  const base = baseUrl.replace(/\/$/, "");
  const list = routes.length > 0 ? routes : ["/"];

  const entries = list
    .map((route) => {
      const url = route === "/" ? base : `${base}${route}`;
      const priority = route === "/" ? 1 : 0.7;
      return [
        "    {",
        `      url: "${url}",`,
        "      lastModified: new Date(),",
        '      changeFrequency: "weekly",',
        `      priority: ${priority},`,
        "    },",
      ].join("\n");
    })
    .join("\n");

  return [
    'import type { MetadataRoute } from "next";',
    "",
    "export default function sitemap(): MetadataRoute.Sitemap {",
    "  return [",
    entries,
    "  ];",
    "}",
    "",
  ].join("\n");
}
