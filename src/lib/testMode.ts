export const isTestMode =
  process.env.NEXT_PUBLIC_E2E_TEST === 'true' ||
  process.env.PLAYWRIGHT_TEST === 'true' ||
  process.env.E2E_TEST === 'true'
