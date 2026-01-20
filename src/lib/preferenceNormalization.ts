const SAME_AS_MINE_VALUES = new Set(['same_as_mine', 'same as mine'])

const isSameAsMine = (value: string | null | undefined): boolean => {
  if (!value) return false
  return SAME_AS_MINE_VALUES.has(value.toLowerCase().trim())
}

const parseStringList = (value: unknown): string[] => {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(item => item)
  }

  if (typeof value !== 'string') return []

  const trimmed = value.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item).trim()).filter(item => item)
      }
    } catch {
      // Fall back to comma-separated parsing
    }
  }

  return trimmed.split(',').map(item => item.trim()).filter(item => item)
}

const dedupeValues = (values: string[]): string[] => {
  const seen = new Set<string>()
  const deduped: string[] = []

  for (const value of values) {
    const key = value.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(value)
    }
  }

  return deduped
}

const resolveStringValue = (
  input: Record<string, unknown>,
  fallback: Record<string, unknown> | undefined,
  keys: string[]
): string | undefined => {
  const sources = [input, fallback].filter(Boolean) as Record<string, unknown>[]

  for (const key of keys) {
    for (const source of sources) {
      const value = source[key]
      if (typeof value === 'string' && value.trim()) {
        return value.trim()
      }
    }
  }

  return undefined
}

const normalizeListField = (value: unknown, replacement?: string): string | undefined => {
  const values = parseStringList(value)
  if (values.length === 0) return undefined

  const hasSameAsMine = values.some(item => isSameAsMine(item))
  if (!hasSameAsMine) return undefined

  const cleaned = values.filter(item => !isSameAsMine(item))
  const replacementValues = parseStringList(replacement)
  const merged = dedupeValues([...cleaned, ...replacementValues])

  return merged.length > 0 ? merged.join(', ') : ''
}

const normalizeSingleField = (value: unknown, replacement?: string): string | undefined => {
  if (typeof value !== 'string') return undefined
  if (!isSameAsMine(value)) return undefined
  return replacement || ''
}

export const normalizeSameAsMinePreferences = <T extends Record<string, unknown>>(
  input: T,
  fallback?: Record<string, unknown>
): T => {
  const normalized = { ...input }

  const listMappings = [
    { prefKey: 'prefCommunityList', sourceKeys: ['community', 'caste'] },
    { prefKey: 'prefCommunity', sourceKeys: ['community', 'caste'] },
    { prefKey: 'prefSubCommunityList', sourceKeys: ['subCommunity'] },
    { prefKey: 'prefSubCommunity', sourceKeys: ['subCommunity'] },
    { prefKey: 'prefMotherTongueList', sourceKeys: ['motherTongue'] },
    { prefKey: 'prefMotherTongue', sourceKeys: ['motherTongue'] },
    { prefKey: 'prefHobbies', sourceKeys: ['hobbies'] },
    { prefKey: 'prefFitness', sourceKeys: ['fitness'] },
    { prefKey: 'prefInterests', sourceKeys: ['interests'] },
  ]

  for (const { prefKey, sourceKeys } of listMappings) {
    if (!(prefKey in normalized)) continue
    const replacement = resolveStringValue(normalized, fallback, sourceKeys)
    const updated = normalizeListField(normalized[prefKey], replacement)
    if (updated !== undefined) {
      normalized[prefKey] = updated
    }
  }

  const singleMappings = [
    { prefKey: 'prefFamilyValues', sourceKeys: ['familyValues'] },
    { prefKey: 'prefFamilyLocationCountry', sourceKeys: ['familyLocation'] },
    { prefKey: 'prefFamilyLocation', sourceKeys: ['familyLocation'] },
    { prefKey: 'prefCitizenship', sourceKeys: ['citizenship', 'country'] },
    { prefKey: 'prefGrewUpIn', sourceKeys: ['grewUpIn', 'country'] },
  ]

  for (const { prefKey, sourceKeys } of singleMappings) {
    if (!(prefKey in normalized)) continue
    const replacement = resolveStringValue(normalized, fallback, sourceKeys)
    const updated = normalizeSingleField(normalized[prefKey], replacement)
    if (updated !== undefined) {
      normalized[prefKey] = updated
    }
  }

  return normalized
}
