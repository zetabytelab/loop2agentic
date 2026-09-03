export function openapiRouteTemplate(siteName: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");

  return [
    'import { NextResponse } from "next/server";',
    "",
    "export function GET() {",
    "  return NextResponse.json({",
    '    openapi: "3.1.0",',
    "    info: {",
    `      title: "${siteName} API",`,
    '      version: "0.1.0",',
    "    },",
    `    servers: [{ url: "${base}" }],`,
    "    paths: {},",
    "  });",
    "}",
    "",
  ].join("\n");
}
