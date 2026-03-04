type EnvMap = Record<string, string | undefined>

function readRuntimeEnv(): EnvMap {
  // Avoid referencing the global `process` symbol directly so client bundles
  // don't require the `process/browser` polyfill.
  const maybeProcess = (globalThis as { process?: { env?: EnvMap } }).process
  if (maybeProcess?.env) return maybeProcess.env
  return {}
}

const runtimeEnv = readRuntimeEnv()
const nextPublicE2E = process.env.NEXT_PUBLIC_E2E_TEST
const playwrightTest = process.env.PLAYWRIGHT_TEST
const e2eTest = process.env.E2E_TEST

export const isTestMode =
  nextPublicE2E === 'true' ||
  playwrightTest === 'true' ||
  e2eTest === 'true' ||
  runtimeEnv.NEXT_PUBLIC_E2E_TEST === 'true' ||
  runtimeEnv.PLAYWRIGHT_TEST === 'true' ||
  runtimeEnv.E2E_TEST === 'true'
