export function jsonLdScriptTag(siteName: string, baseUrl: string, description: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const graph = [
    {
      "@type": "Organization",
      name: siteName,
      url: base,
      description,
      isAccessibleForFree: true,
    },
    {
      "@type": "WebSite",
      name: siteName,
      url: base,
      description,
      isAccessibleForFree: true,
    },
  ];

  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  const safeForScriptTag = json.replace(/</g, "\\u003c");

  return [
    "        <script",
    '          type="application/ld+json"',
    `          dangerouslySetInnerHTML={{ __html: ${JSON.stringify(safeForScriptTag)} }}`,
    "        />",
  ].join("\n");
}
