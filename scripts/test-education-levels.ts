// Test education matching - "undergrad" should match masters and doctorate too

const EDUCATION_LEVELS: Record<string, number> = {
  'high_school': 1, 'diploma': 1,
  'undergrad': 2, 'undergrad_eng': 2, 'undergrad_cs': 2, 'bachelors': 2, 'mbbs': 2, 'bds': 2, 'llb': 2,
  'masters': 3, 'masters_eng': 3, 'masters_cs': 3, 'mba': 3, 'md': 3, 'ca_cpa': 3, 'llm': 3,
  'phd': 4, 'dm_mch': 4,
}

const PREF_CONFIG: Record<string, { type: string; minLevel?: number }> = {
  'undergrad': { type: 'level', minLevel: 2 },
  'masters': { type: 'level', minLevel: 3 },
}

function getLevel(qual: string | null): number {
  if (!qual) return 0
  return EDUCATION_LEVELS[qual.toLowerCase()] || 0
}

function isMatch(pref: string, candidateQual: string): boolean {
  const config = PREF_CONFIG[pref]
  if (config?.type === 'level' && config.minLevel) {
    const candidateLevel = getLevel(candidateQual)
    return candidateLevel >= config.minLevel
  }
  return false
}

console.log("=== Testing 'undergrad' preference (should match level 2+) ===\n")

const tests = [
  { pref: "undergrad", qual: "high_school", expected: false },
  { pref: "undergrad", qual: "undergrad", expected: true },
  { pref: "undergrad", qual: "undergrad_eng", expected: true },
  { pref: "undergrad", qual: "mbbs", expected: true },
  { pref: "undergrad", qual: "masters", expected: true },
  { pref: "undergrad", qual: "masters_eng", expected: true },
  { pref: "undergrad", qual: "mba", expected: true },
  { pref: "undergrad", qual: "md", expected: true },
  { pref: "undergrad", qual: "phd", expected: true },
  { pref: "undergrad", qual: "dm_mch", expected: true },
]

let passed = 0
for (const t of tests) {
  const result = isMatch(t.pref, t.qual)
  const ok = result === t.expected
  if (ok) passed++
  const level = getLevel(t.qual)
  const status = ok ? "✓" : "✗"
  console.log(`${status} Pref "${t.pref}" vs "${t.qual}" (level ${level}): ${result}`)
}

console.log(`\n${passed}/${tests.length} tests passed`)

console.log("\n=== Testing 'masters' preference (should match level 3+) ===\n")

const tests2 = [
  { pref: "masters", qual: "undergrad", expected: false },
  { pref: "masters", qual: "mbbs", expected: false },
  { pref: "masters", qual: "masters", expected: true },
  { pref: "masters", qual: "md", expected: true },
  { pref: "masters", qual: "phd", expected: true },
]

let passed2 = 0
for (const t of tests2) {
  const result = isMatch(t.pref, t.qual)
  const ok = result === t.expected
  if (ok) passed2++
  const level = getLevel(t.qual)
  const status = ok ? "✓" : "✗"
  console.log(`${status} Pref "${t.pref}" vs "${t.qual}" (level ${level}): ${result}`)
}

console.log(`\n${passed2}/${tests2.length} tests passed`)
