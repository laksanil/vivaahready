import { DISABILITY_OPTIONS } from '@/lib/constants'

const DISABILITY_LABELS = new Map(DISABILITY_OPTIONS.map((option) => [option.value, option.label]))

export function formatDisabilityDisplay(value: string | null | undefined): string | null {
  if (!value) return null
  if (value === 'none') return 'None'
  return DISABILITY_LABELS.get(value) || value.replace(/_/g, ' ')
}
