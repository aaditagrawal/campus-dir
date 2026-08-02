import { getAllSearchItems, type SearchItem } from "@/lib/search"

/**
 * Prefix-matching inverted index over the directory.
 *
 * Fuse scores every item against the query on every keystroke — bitap across
 * five fields for all ~200 entries, which is linear in the corpus no matter
 * how specific the query is. Typing is exactly the workload that punishes
 * that: a full scan per character.
 *
 * Almost every real query here is a prefix of something — a restaurant name, a
 * warden, a block, a phone number. Those resolve out of an inverted index in
 * time proportional to the number of matches rather than the size of the
 * corpus. Fuse stays for the queries the index cannot answer (typos,
 * transpositions), loaded on demand rather than in the bundle of every page.
 */

/** Matches the weights the Fuse configuration used, so ranking stays familiar. */
const FIELD_WEIGHTS = {
  title: 0.5,
  phones: 0.15,
  subtitle: 0.15,
  section: 0.1,
  notes: 0.1,
} as const

const MAX_RESULTS = 10
/** One bit per query term in the coverage mask; stays inside a signed 32-bit int. */
const MAX_TERMS = 30

type Posting = {
  item: number
  /** Field weight, already adjusted for the term's position in its field. */
  weight: number
}

type Index = {
  items: readonly SearchItem[]
  /** Unique tokens, sorted, so a prefix range is a binary search. */
  tokens: readonly string[]
  postings: ReadonlyArray<readonly Posting[]>
}

/* -------------------------------------------------------------------------- */
/* Tokenization                                                               */
/* -------------------------------------------------------------------------- */

/** Splits on anything that is not a letter or digit, folding ASCII case. */
function tokenize(text: string, into: string[]): string[] {
  let current = ""
  for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i)
    if (code >= 65 && code <= 90) code += 32

    const isAlnum =
      (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code > 127
    if (isAlnum) {
      current += String.fromCharCode(code)
    } else if (current.length > 0) {
      into.push(current)
      current = ""
    }
  }
  if (current.length > 0) into.push(current)
  return into
}

/** Digits only, plus the subscriber number, so "+91 77958..." matches "77958...". */
function phoneTokens(phone: string, into: string[]): string[] {
  let digits = ""
  for (let i = 0; i < phone.length; i++) {
    const code = phone.charCodeAt(i)
    if (code >= 48 && code <= 57) digits += phone[i]
  }
  if (digits.length === 0) return into

  into.push(digits)
  if (digits.length > 10) into.push(digits.slice(digits.length - 10))
  return into
}

/* -------------------------------------------------------------------------- */
/* Index construction                                                         */
/* -------------------------------------------------------------------------- */

let index: Index | null = null

function build(): Index {
  const items = getAllSearchItems()

  // token -> item -> best posting. Deduplicates a token that appears in more
  // than one of an item's fields, keeping the strongest match.
  const collected = new Map<string, Map<number, Posting>>()
  const scratch: string[] = []

  const add = (token: string, item: number, weight: number) => {
    let byItem = collected.get(token)
    if (!byItem) {
      byItem = new Map()
      collected.set(token, byItem)
    }
    const existing = byItem.get(item)
    if (existing === undefined || weight > existing.weight) {
      byItem.set(item, { item, weight })
    }
  }

  const addField = (text: string | undefined, item: number, weight: number) => {
    if (!text) return
    scratch.length = 0
    tokenize(text, scratch)
    for (let position = 0; position < scratch.length; position++) {
      // The leading token of a field is what people type first.
      add(scratch[position], item, position === 0 ? weight * 1.25 : weight)
    }
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    addField(item.title, i, FIELD_WEIGHTS.title)
    addField(item.subtitle, i, FIELD_WEIGHTS.subtitle)
    addField(item.section, i, FIELD_WEIGHTS.section)
    addField(item.notes, i, FIELD_WEIGHTS.notes)

    if (item.phones) {
      for (const phone of item.phones) {
        scratch.length = 0
        for (const token of phoneTokens(phone, scratch)) {
          add(token, i, FIELD_WEIGHTS.phones)
        }
      }
    }
  }

  const tokens = Array.from(collected.keys()).sort()
  const postings = tokens.map((token) => Array.from(collected.get(token)!.values()))

  return { items, tokens, postings }
}

/** Built on first use — opening the dialog, not loading the page. */
function getIndex(): Index {
  if (index === null) index = build()
  return index
}

/* -------------------------------------------------------------------------- */
/* Query                                                                      */
/* -------------------------------------------------------------------------- */

/** First position at which `prefix` could be inserted and keep `tokens` sorted. */
function lowerBound(tokens: readonly string[], prefix: string): number {
  let low = 0
  let high = tokens.length
  while (low < high) {
    const mid = (low + high) >> 1
    if (tokens[mid] < prefix) low = mid + 1
    else high = mid
  }
  return low
}

// Reused across queries so a keystroke allocates nothing. Safe because search
// runs on one thread and never yields mid-query.
const scores = new Map<number, number>()
const coverage = new Map<number, number>()
const termBest = new Map<number, number>()

function searchIndexed(query: string): SearchItem[] {
  const { items, tokens, postings } = getIndex()

  const terms = tokenize(query, [])
  if (terms.length === 0) return []
  if (terms.length > MAX_TERMS) terms.length = MAX_TERMS

  scores.clear()
  coverage.clear()

  for (let t = 0; t < terms.length; t++) {
    const term = terms[t]
    termBest.clear()

    // Every token carrying this prefix sits in one contiguous run of the
    // sorted token list, so the binary search lands on all of them at once.
    for (let i = lowerBound(tokens, term); i < tokens.length; i++) {
      const token = tokens[i]
      if (!token.startsWith(term)) break

      // A term covering all of a token beats one covering a sliver of it.
      const ratio = term.length / token.length
      for (const posting of postings[i]) {
        const gain = posting.weight * ratio
        const previous = termBest.get(posting.item)
        if (previous === undefined || gain > previous) {
          termBest.set(posting.item, gain)
        }
      }
    }

    // Each term contributes once per item, at its strongest match.
    const bit = 1 << t
    for (const [item, gain] of termBest) {
      scores.set(item, (scores.get(item) ?? 0) + gain)
      coverage.set(item, (coverage.get(item) ?? 0) | bit)
    }
  }

  // Every term has to land somewhere, so "taco house" does not match a Taco
  // that has nothing to do with a House.
  const required = (1 << terms.length) - 1

  // Bounded selection. A candidate that cannot beat the current worst kept
  // result is rejected on one comparison, so this stays linear in candidates.
  const best: Array<{ item: number; score: number }> = []
  for (const [item, score] of scores) {
    if (coverage.get(item) !== required) continue
    if (best.length === MAX_RESULTS && score <= best[MAX_RESULTS - 1].score) continue

    let at = best.length
    while (at > 0 && best[at - 1].score < score) at--
    best.splice(at, 0, { item, score })
    if (best.length > MAX_RESULTS) best.pop()
  }

  return best.map((entry) => items[entry.item])
}

/* -------------------------------------------------------------------------- */
/* Fuzzy fallback                                                             */
/* -------------------------------------------------------------------------- */

type FuzzyEngine = { search: (query: string) => Array<{ item: SearchItem }> }

let fuzzy: FuzzyEngine | null = null
let fuzzyLoad: Promise<void> | null = null

/**
 * Pulls in Fuse.
 *
 * It used to be imported statically by the header, so every page paid for it
 * whether or not the user ever opened search. Now it arrives while the dialog
 * is open and the user is still typing their first characters.
 */
export function loadFuzzyEngine(): Promise<void> {
  if (fuzzyLoad === null) {
    fuzzyLoad = import("fuse.js").then(({ default: Fuse }) => {
      fuzzy = new Fuse(getIndex().items as SearchItem[], {
        keys: [
          { name: "title", weight: 0.5 },
          { name: "subtitle", weight: 0.15 },
          { name: "section", weight: 0.1 },
          { name: "phones", weight: 0.15 },
          { name: "notes", weight: 0.1 },
        ],
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
      })
    })
  }
  return fuzzyLoad
}

export function isFuzzyEngineReady(): boolean {
  return fuzzy !== null
}

/**
 * Index first, fuzzy only on a dead end.
 *
 * A query that matches nothing at all is the typo signal. A query that matches
 * one thing is a user who has found what they wanted, and asking Fuse to
 * pad the list out would cost more than the whole index lookup did.
 */
export function searchDirectory(query: string): SearchItem[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const results = searchIndexed(trimmed)
  if (results.length > 0 || fuzzy === null) return results

  return fuzzy
    .search(trimmed)
    .slice(0, MAX_RESULTS)
    .map(({ item }) => item)
}

/* -------------------------------------------------------------------------- */
/* Suggestions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * `sort(() => Math.random() - 0.5)` is not a shuffle — the comparator is not a
 * consistent ordering, so the result is biased and the sort's behaviour is
 * implementation defined. A partial Fisher-Yates draws `count` items uniformly
 * in O(count) rather than sorting the whole pool.
 */
export function sampleSuggestions(count: number): SearchItem[] {
  const pool = getIndex().items.filter((item) => item.section !== "Pages")
  if (pool.length <= count) return pool.slice()

  const picked = pool.slice()
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (picked.length - i))
    const swap = picked[i]
    picked[i] = picked[j]
    picked[j] = swap
  }
  picked.length = count
  return picked
}
