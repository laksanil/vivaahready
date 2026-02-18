type EnvMap = Record<string, string | undefined>

function readRuntimeEnv(): EnvMap {
  // Avoid referencing the global `process` symbol directly so client bundles
  // don't require the `process/browser` polyfill.
  const maybeProcess = (globalThis as { process?: { env?: EnvMap } }).process
  if (maybeProcess?.env) return maybeProcess.env
  return {}
}

const runtimeEnv = readRuntimeEnv()

export const isTestMode =
  runtimeEnv.NEXT_PUBLIC_E2E_TEST === 'true' ||
  runtimeEnv.PLAYWRIGHT_TEST === 'true' ||
  runtimeEnv.E2E_TEST === 'true'
