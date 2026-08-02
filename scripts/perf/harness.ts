/**
 * Minimal equivalence + benchmark harness for the perf work in `src/lib`.
 *
 * Run with `bun run scripts/perf/<name>.ts`. Deliberately dependency-free so it
 * costs nothing at install time and never ships in the app bundle.
 */

/** Deterministic xorshift32 so fuzz corpora reproduce across runs and machines. */
export function makeRandom(seed: number) {
  let state = seed >>> 0 || 1
  return function next(): number {
    state ^= state << 13
    state >>>= 0
    state ^= state >> 17
    state ^= state << 5
    state >>>= 0
    return state / 0x100000000
  }
}

export function assertEquivalent<T>(
  label: string,
  corpus: T[],
  a: (value: T) => unknown,
  b: (value: T) => unknown,
): void {
  let mismatches = 0
  for (const value of corpus) {
    const expected = a(value)
    const actual = b(value)
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      if (mismatches < 10) {
        console.error(
          `  mismatch on ${JSON.stringify(value)}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
        )
      }
      mismatches++
    }
  }
  if (mismatches > 0) {
    console.error(`FAIL ${label}: ${mismatches}/${corpus.length} mismatched`)
    process.exitCode = 1
    return
  }
  console.log(`  ok  ${label} — ${corpus.length} inputs agree`)
}

/** Median ops/sec over `rounds` timed passes, after a warmup pass. */
export function bench(label: string, iterations: number, fn: () => void, rounds = 7): number {
  for (let i = 0; i < Math.min(iterations, 1000); i++) fn()

  const samples: number[] = []
  for (let round = 0; round < rounds; round++) {
    const start = performance.now()
    for (let i = 0; i < iterations; i++) fn()
    samples.push(performance.now() - start)
  }
  samples.sort((x, y) => x - y)
  const median = samples[rounds >> 1]
  const opsPerSec = (iterations / median) * 1000
  console.log(`  ${label.padEnd(38)} ${median.toFixed(2)}ms  (${formatOps(opsPerSec)} ops/s)`)
  return opsPerSec
}

function formatOps(ops: number): string {
  if (ops >= 1e6) return `${(ops / 1e6).toFixed(2)}M`
  if (ops >= 1e3) return `${(ops / 1e3).toFixed(1)}K`
  return ops.toFixed(0)
}

export function speedup(label: string, before: number, after: number): void {
  console.log(`  → ${label}: ${(after / before).toFixed(2)}x`)
}
