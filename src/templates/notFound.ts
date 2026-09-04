export function notFoundTemplate(siteName: string): string {
  return [
    'import Link from "next/link";',
    "",
    "export default function NotFound() {",
    "  return (",
    "    <main>",
    "      <h1>404 — Page not found</h1>",
    `      <p>This page does not exist on ${siteName}. Here are some places to go instead:</p>`,
    "      <ul>",
    '        <li><Link href="/">Home</Link></li>',
    '        <li><a href="/sitemap.xml">Sitemap</a></li>',
    '        <li><a href="/llms.txt">llms.txt</a></li>',
    "      </ul>",
    "    </main>",
    "  );",
    "}",
    "",
  ].join("\n");
}
