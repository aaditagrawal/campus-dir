/**
 * Next's app router always emits a client runtime (React, the router, and
 * metadata boundaries) even when a page renders only server HTML. Directory
 * pages that do not hydrate do not need that runtime. After export, drop it
 * from those documents and keep it on pages that ship an extra chunk.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");
const homePath = path.join(outDir, "index.html");

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

function scriptSrcs(html) {
  const srcs = [];
  for (const span of scriptSpans(html)) {
    const src = scriptSrc(span.attrs);
    if (src !== null) srcs.push(src);
  }
  return srcs;
}

function dropSpan(span) {
  if (scriptSrc(span.attrs) !== null) return true;
  return span.body.includes("__next_f") || span.body.includes("TURBOPACK");
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
  return stripLinks(html, (tag) => tag.includes('rel="preload"') && tag.includes('as="script"'));
}

function stripManifestLink(html) {
  return stripLinks(html, (tag) => tag.includes('rel="manifest"'));
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

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith(".html")) files.push(full);
  }
  return files;
}

function referencesRuntimeScript(html) {
  return (
    /<script\b[^>]*\ssrc="\/_next\/static\/chunks\//.test(html) ||
    /<link\b[^>]*rel="preload"[^>]*as="script"/.test(html)
  );
}

function usesOnlyHomeRuntime(srcs, homeSrcs) {
  for (const src of srcs) {
    if (!homeSrcs.has(src)) return false;
  }
  return true;
}

const homeHtml = await readFile(homePath, "utf8");
const homeSrcs = new Set(scriptSrcs(homeHtml));
if (homeSrcs.size === 0) {
  throw new Error("Home page has no framework scripts to use as the static baseline.");
}

const files = await htmlFiles(outDir);
let stripped = 0;
let kept = 0;
for (const file of files) {
  const original = await readFile(file, "utf8");
  const html = stripManifestLink(original);
  if (!usesOnlyHomeRuntime(scriptSrcs(html), homeSrcs)) {
    if (html !== original) await writeFile(file, html);
    kept += 1;
    continue;
  }
  const next = stripRuntime(html);
  if (!next.includes("THEME_KEY")) {
    throw new Error(`${path.relative(outDir, file)} lost the document boot script.`);
  }
  if (referencesRuntimeScript(next)) {
    throw new Error(`${path.relative(outDir, file)} still references the framework runtime.`);
  }
  await writeFile(file, next);
  stripped += 1;
}

const home = await readFile(homePath, "utf8");
if (!home.includes("Quick actions")) {
  throw new Error("Home page lost its rendered content.");
}
const restaurants = await readFile(path.join(outDir, "restaurants", "index.html"), "utf8");
if (!restaurants.includes("/_next/static/chunks/")) {
  throw new Error("Restaurants lost the client runtime it still hydrates.");
}

console.log(
  `Static runtime stripped from ${stripped} documents. ${kept} interactive documents kept their scripts.`,
);
