import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const HYPHEN = 45

/**
 * Whitespace as JS regex `\s` and `String.prototype.trim` define it. Codes are
 * ordered so the common ASCII cases exit on the first comparison.
 */
function isWhitespace(code: number): boolean {
  if (code === 32) return true
  if (code < 128) return code >= 9 && code <= 13
  return (
    code === 0x00a0 ||
    code === 0x1680 ||
    (code >= 0x2000 && code <= 0x200a) ||
    code === 0x2028 ||
    code === 0x2029 ||
    code === 0x202f ||
    code === 0x205f ||
    code === 0x3000 ||
    code === 0xfeff
  )
}

/**
 * Emits the slug in a single scan.
 *
 * Runs of separators (whitespace and hyphens) collapse to one hyphen. A leading
 * or trailing run collapses only when it contains a literal hyphen — pure
 * whitespace at the edges is trimmed away instead.
 *
 * `foldCase` maps A-Z to a-z inline. It is off for input that has already been
 * lowercased and NFKD-normalized, where an uppercase letter can only be a
 * decomposition artifact and is dropped rather than folded.
 */
function buildSlug(input: string, foldCase: boolean): string {
  let out = ""
  let sawContent = false
  let inSeparator = false
  let separatorHasHyphen = false

  for (let i = 0; i < input.length; i++) {
    let code = input.charCodeAt(i)

    if (foldCase && code >= 65 && code <= 90) code += 32

    const isAlnum = (code >= 97 && code <= 122) || (code >= 48 && code <= 57)
    if (isAlnum) {
      if (inSeparator) {
        if (sawContent || separatorHasHyphen) out += "-"
        inSeparator = false
        separatorHasHyphen = false
      }
      out += String.fromCharCode(code)
      sawContent = true
      continue
    }

    if (code === HYPHEN) {
      inSeparator = true
      separatorHasHyphen = true
    } else if (isWhitespace(code)) {
      inSeparator = true
    }
    // Everything else — punctuation, combining marks, undecomposable
    // symbols — is dropped, matching the previous `[^a-z0-9\s-]` filter.
  }

  if (inSeparator && separatorHasHyphen) out += "-"
  return out
}

const slugCache = new Map<string, string>()
const SLUG_CACHE_LIMIT = 2048

/**
 * `slugify` without the memo table. Exported for the perf harness and for
 * callers slugging unbounded one-off input that should not enter the cache.
 */
export function slugifyUncached(input: string): string {
  // Fast path: pure ASCII needs neither case-folding tables nor NFKD, so the
  // whole slug comes out of one scan with one string allocation.
  let ascii = true
  for (let i = 0; i < input.length; i++) {
    if (input.charCodeAt(i) > 127) {
      ascii = false
      break
    }
  }
  if (ascii) return buildSlug(input, true)

  return buildSlug(input.toLowerCase().normalize("NFKD"), false)
}

/**
 * Lowercased, hyphen-separated, ASCII-only slug used for anchor ids and hrefs.
 *
 * Results are memoized: slugs are derived from a fixed set of directory names
 * and the same handful of strings is re-slugged on every render and every
 * search-index build.
 */
export function slugify(input: string): string {
  const cached = slugCache.get(input)
  if (cached !== undefined) return cached

  const slug = slugifyUncached(input)
  // Bounded so a pathological caller cannot grow the cache without limit.
  if (slugCache.size >= SLUG_CACHE_LIMIT) slugCache.clear()
  slugCache.set(input, slug)
  return slug
}
