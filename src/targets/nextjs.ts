import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface WriteResult {
  path: string;
  written: boolean;
  reason?: string;
}

export interface RepoCtx {
  repoRoot: string;
  appDir: string;
  appDirRel: string;
  publicDir: string;
  publicDirRel: string;
  siteName: string;
  baseUrl: string;
  hasApiDir: boolean;
  writeFile: (relPath: string, content: string) => WriteResult;
  hasFile: (relPath: string) => boolean;
  fileContains: (relPath: string, marker: string) => boolean;
  readFile: (relPath: string) => string | null;
}

const PAGE_FILENAMES = new Set(["page.tsx", "page.ts", "page.jsx", "page.js"]);

export function detectAppRouter(repoRoot: string): { appDir: string; appDirRel: string } | null {
  const candidates: Array<{ dir: string; rel: string }> = [
    { dir: path.join(repoRoot, "app"), rel: "app" },
    { dir: path.join(repoRoot, "src", "app"), rel: path.join("src", "app") },
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate.dir) && statSync(candidate.dir).isDirectory()) {
      return { appDir: candidate.dir, appDirRel: candidate.rel };
    }
  }

  return null;
}

function deriveSiteName(repoRoot: string): string {
  try {
    const pkgRaw = readFileSync(path.join(repoRoot, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw) as { name?: string };
    if (pkg.name) return pkg.name;
  } catch {
    // no package.json or malformed JSON: fall back to directory name
  }
  return path.basename(repoRoot);
}

export function createRepoCtx(repoRoot: string, baseUrl: string): RepoCtx {
  const detected = detectAppRouter(repoRoot);
  if (!detected) {
    throw new Error(
      `Could not find a Next.js App Router "app" directory under ${repoRoot} (looked for app/ and src/app/)`,
    );
  }

  const { appDir, appDirRel } = detected;
  const publicDirRel = "public";
  const publicDir = path.join(repoRoot, publicDirRel);
  const siteName = deriveSiteName(repoRoot);
  const hasApiDir = existsSync(path.join(appDir, "api"));

  function resolve(relPath: string): string {
    return path.join(repoRoot, relPath);
  }

  function hasFile(relPath: string): boolean {
    return existsSync(resolve(relPath));
  }

  function readFile(relPath: string): string | null {
    const full = resolve(relPath);
    if (!existsSync(full)) return null;
    return readFileSync(full, "utf8");
  }

  function fileContains(relPath: string, marker: string): boolean {
    const content = readFile(relPath);
    return content !== null && content.includes(marker);
  }

  function writeFile(relPath: string, content: string): WriteResult {
    const full = resolve(relPath);
    if (existsSync(full)) {
      return { path: relPath, written: false, reason: "already exists" };
    }
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, content, "utf8");
    return { path: relPath, written: true };
  }

  return {
    repoRoot,
    appDir,
    appDirRel,
    publicDir,
    publicDirRel,
    siteName,
    baseUrl,
    hasApiDir,
    writeFile,
    hasFile,
    fileContains,
    readFile,
  };
}

/**
 * Walks the App Router tree and returns static page routes ("/", "/about", ...).
 * Route groups "(marketing)" are flattened; dynamic segments "[slug]" and private
 * folders "_lib" are skipped since we can't enumerate their param values statically.
 */
export function crawlPageRoutes(appDir: string): string[] {
  const routes: string[] = [];

  function walk(dir: string, segments: string[]): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    if (entries.some((entry) => PAGE_FILENAMES.has(entry))) {
      routes.push(segments.length === 0 ? "/" : `/${segments.join("/")}`);
    }

    for (const entry of entries) {
      const full = path.join(dir, entry);
      let isDirectory: boolean;
      try {
        isDirectory = statSync(full).isDirectory();
      } catch {
        continue;
      }
      if (!isDirectory) continue;
      if (entry.startsWith("_")) continue;
      if (entry === "api") continue;
      if (entry.startsWith("[")) continue;

      if (entry.startsWith("(") && entry.endsWith(")")) {
        walk(full, segments);
      } else {
        walk(full, [...segments, entry]);
      }
    }
  }

  walk(appDir, []);
  return Array.from(new Set(routes)).sort();
}
