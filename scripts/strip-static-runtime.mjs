/**
 * Remove Next's client runtime from explicitly server-only directory routes.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");
const serverApp = path.join(process.cwd(), ".next", "server", "app");
const serverOnlyRoutes = [
  "",
  "_not-found",
  "academics",
  "campus-life",
  "emergency",
  "grievance",
  "services",
  "tools",
  "travel",
  "travel/auto",
];
const interactiveRoutes = ["favorites", "hostels", "restaurants", "search", "tools/mail-to-warden"];
// Vercel's Next.js adapter places chunks under static/immutable.
const nextChunkUrl = /^\/_next\/static\/(?:immutable\/)?chunks\//;

function scriptSpans(html) {
  const spans = [];
  let cursor = 0;
  while (cursor < html.length) {
    const start = html.indexOf("<script", cursor);
    if (start === -1) break;
    const openEnd = html.indexOf(">", start);
    const close = html.indexOf("</script>", openEnd);
    if (openEnd === -1 || close === -1) break;
    spans.push({
      start,
      end: close + "</script>".length,
      attrs: html.slice(start, openEnd + 1),
      body: html.slice(openEnd + 1, close),
    });
    cursor = close + "</script>".length;
  }
  return spans;
}

function scriptSrc(attrs) {
  const match = / src="([^"]+)"/.exec(attrs);
  return match === null ? null : match[1];
}

function dropSpan(span) {
  const src = scriptSrc(span.attrs);
  if (src !== null) return nextChunkUrl.test(src);
  return /^\s*(?:\(self\.__next_f|self\.__next_f\.push\(|.*TURBOPACK)/.test(span.body);
}

function stripLinks(html, shouldDrop) {
  let cursor = 0;
  let result = "";
  while (cursor < html.length) {
    const start = html.indexOf("<link", cursor);
    if (start === -1) {
      result += html.slice(cursor);
      break;
    }
    const end = html.indexOf(">", start);
    if (end === -1) {
      result += html.slice(cursor);
      break;
    }
    const tag = html.slice(start, end + 1);
    result += html.slice(cursor, start);
    if (!shouldDrop(tag)) result += tag;
    cursor = end + 1;
  }
  return result;
}

function stripPreloadedScripts(html) {
  return stripLinks(
    html,
    (tag) =>
      tag.includes('rel="preload"') &&
      tag.includes('as="script"') &&
      nextChunkUrl.test(/ href="([^"]+)"/.exec(tag)?.[1] ?? ""),
  );
}

function stripRuntime(html) {
  const withoutPreload = stripPreloadedScripts(html);
  const spans = scriptSpans(withoutPreload);
  let cursor = 0;
  let result = "";
  for (const span of spans) {
    result += withoutPreload.slice(cursor, span.start);
    if (!dropSpan(span)) result += withoutPreload.slice(span.start, span.end);
    cursor = span.end;
  }
  result += withoutPreload.slice(cursor);
  return result;
}

async function assertServerOnly(route) {
  const manifestFile = path.join(serverApp, route, "page_client-reference-manifest.js");
  const manifest = await readFile(manifestFile, "utf8");
  const assignment = /^globalThis\.__RSC_MANIFEST\["[^"]+"\] = (\{.*\});?$/m.exec(manifest);
  if (!assignment) throw new Error(`Cannot verify route /${route} has no client components.`);
  const { clientModules } = JSON.parse(assignment[1]);
  const applicationImports = Object.keys(clientModules).filter(
    (id) => !id.startsWith("[project]/node_modules/next/"),
  );
  if (applicationImports.length > 0) {
    throw new Error(`Cannot strip /${route}; client modules: ${applicationImports.join(", ")}`);
  }
}

function referencesRuntimeScript(html) {
  return scriptSpans(html).some((span) => nextChunkUrl.test(scriptSrc(span.attrs) ?? ""));
}

for (const route of serverOnlyRoutes) await assertServerOnly(route);

const staticFiles = [
  ...serverOnlyRoutes.map((route) => path.join(route, "index.html")),
  "404.html",
  path.join("404", "index.html"),
];
for (const name of staticFiles) {
  const file = path.join(outDir, name);
  const html = stripRuntime(await readFile(file, "utf8"));
  if (!html.includes("THEME_KEY") || referencesRuntimeScript(html)) {
    throw new Error(`Unexpected script inventory in ${name}.`);
  }
  if (name === "index.html" && !html.includes("Quick actions")) {
    throw new Error("Home page lost its rendered content.");
  }
  await writeFile(file, html);
}

for (const route of interactiveRoutes) {
  const html = await readFile(path.join(outDir, route, "index.html"), "utf8");
  if (!referencesRuntimeScript(html)) {
    throw new Error(`/${route} lost its client runtime.`);
  }
}

console.log(
  `Static runtime stripped from ${staticFiles.length} documents. ${interactiveRoutes.length} interactive routes kept their scripts.`,
);
