import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/* eslint-disable no-console -- This script reports CI failures to the terminal. */

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const forbiddenDependencies = [
  "@tailwindcss/postcss",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "tailwindcss",
  "tw-animate-css",
];
const forbiddenSourceReference =
  /(?:@tailwindcss\/|\btailwind(?:css)?\b|\btwMerge\b|\bclsx\b|class-variance-authority|tailwind-merge|tw-animate-css)/i;
const allowedNextFontClassName =
  "className={`${instrumentSerif.variable} ${instrumentSans.variable}`}";

const failures = [];

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return sourceFiles(fullPath);
      if (/\.(css|js|jsx|ts|tsx)$/.test(entry.name)) return [fullPath];
      return [];
    }),
  );

  return files.flat();
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const dependencyNames = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
]);

for (const dependency of forbiddenDependencies) {
  if (dependencyNames.has(dependency)) failures.push(`forbidden dependency: ${dependency}`);
}

const files = await sourceFiles(sourceRoot);
const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));

for (const [index, file] of files.entries()) {
  const relative = path.relative(root, file);
  const source = sources[index];

  if (forbiddenSourceReference.test(source)) {
    failures.push(`${relative}: references the removed Tailwind utility stack`);
  }
  if (/@(?:apply|config|custom-variant|plugin|theme|utility|variant)\b/.test(source)) {
    failures.push(`${relative}: contains a Tailwind directive`);
  }
  const sourceWithoutNextFontHook =
    relative === "src/app/layout.tsx" ? source.replace(allowedNextFontClassName, "") : source;
  if (/className\s*=/.test(sourceWithoutNextFontHook)) {
    failures.push(`${relative}: assigns className directly; use StyleX instead`);
  }
}

if (failures.length > 0) {
  console.error("StyleX migration guard failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("StyleX migration guard passed.");
}
