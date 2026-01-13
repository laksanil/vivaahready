#!/usr/bin/env npx ts-node
/**
 * Comprehensive Test Runner for Claude Code
 *
 * This script runs all tests and generates a detailed report
 * optimized for Claude Code's context window.
 *
 * Usage:
 *   npx ts-node scripts/run-tests.ts          # Run all tests
 *   npx ts-node scripts/run-tests.ts --quick  # Run quick smoke tests
 *   npx ts-node scripts/run-tests.ts --unit   # Run unit tests only
 *   npx ts-node scripts/run-tests.ts --e2e    # Run E2E tests only
 */

import { execSync, spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
}

interface TestSummary {
  passed: number
  failed: number
  skipped: number
  total: number
  duration: number
  failedTests: TestResult[]
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function runCommand(command: string, description: string): { success: boolean; output: string } {
  log(`\n${description}...`, colors.cyan)
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 300000, // 5 minute timeout
    })
    return { success: true, output }
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string }
    return { success: false, output: execError.stdout || execError.stderr || 'Unknown error' }
  }
}

function parseVitestOutput(output: string): TestSummary {
  const summary: TestSummary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    duration: 0,
    failedTests: [],
  }

  // Parse vitest output
  const passMatch = output.match(/(\d+) passed/)
  const failMatch = output.match(/(\d+) failed/)
  const skipMatch = output.match(/(\d+) skipped/)
  const durationMatch = output.match(/Duration\s+([\d.]+)s/)

  if (passMatch) summary.passed = parseInt(passMatch[1])
  if (failMatch) summary.failed = parseInt(failMatch[1])
  if (skipMatch) summary.skipped = parseInt(skipMatch[1])
  if (durationMatch) summary.duration = parseFloat(durationMatch[1])

  summary.total = summary.passed + summary.failed + summary.skipped

  // Extract failed test names
  const failedRegex = /FAIL\s+(.+?)(?:\n|$)/g
  let match
  while ((match = failedRegex.exec(output)) !== null) {
    summary.failedTests.push({
      name: match[1].trim(),
      status: 'failed',
      duration: 0,
    })
  }

  return summary
}

function parsePlaywrightOutput(output: string): TestSummary {
  const summary: TestSummary = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    duration: 0,
    failedTests: [],
  }

  // Parse playwright output
  const resultMatch = output.match(/(\d+) passed.*?(\d+)? failed?.*?(\d+)? skipped?/i)
  if (resultMatch) {
    summary.passed = parseInt(resultMatch[1]) || 0
    summary.failed = parseInt(resultMatch[2]) || 0
    summary.skipped = parseInt(resultMatch[3]) || 0
  }

  // Simpler parsing for passed count
  const passedMatch = output.match(/(\d+)\s+passed/)
  const failedMatch = output.match(/(\d+)\s+failed/)

  if (passedMatch) summary.passed = parseInt(passedMatch[1])
  if (failedMatch) summary.failed = parseInt(failedMatch[1])

  summary.total = summary.passed + summary.failed + summary.skipped

  // Extract failed test names
  const lines = output.split('\n')
  for (const line of lines) {
    if (line.includes('✘') || line.includes('FAILED')) {
      summary.failedTests.push({
        name: line.replace(/[✘×]/g, '').trim(),
        status: 'failed',
        duration: 0,
      })
    }
  }

  return summary
}

function generateReport(unitResults: TestSummary, e2eResults: TestSummary): string {
  const totalPassed = unitResults.passed + e2eResults.passed
  const totalFailed = unitResults.failed + e2eResults.failed
  const totalTests = unitResults.total + e2eResults.total
  const allPassed = totalFailed === 0

  let report = `
╔══════════════════════════════════════════════════════════════╗
║                    TEST RESULTS SUMMARY                      ║
╠══════════════════════════════════════════════════════════════╣
║ Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}                            ║
╠══════════════════════════════════════════════════════════════╣
║ Unit Tests:  ${String(unitResults.passed).padStart(3)}/${String(unitResults.total).padStart(3)} passed                                  ║
║ E2E Tests:   ${String(e2eResults.passed).padStart(3)}/${String(e2eResults.total).padStart(3)} passed                                  ║
╠══════════════════════════════════════════════════════════════╣
║ Total:       ${String(totalPassed).padStart(3)}/${String(totalTests).padStart(3)} passed (${Math.round((totalPassed / totalTests) * 100)}%)                           ║
╚══════════════════════════════════════════════════════════════╝
`

  if (totalFailed > 0) {
    report += `
╔══════════════════════════════════════════════════════════════╗
║                      FAILED TESTS                            ║
╠══════════════════════════════════════════════════════════════╣`

    const allFailedTests = [...unitResults.failedTests, ...e2eResults.failedTests]
    for (const test of allFailedTests) {
      report += `\n║ ❌ ${test.name.slice(0, 56).padEnd(56)} ║`
    }

    report += `
╚══════════════════════════════════════════════════════════════╝

To fix failed tests, run:
  npm run test:watch     # For unit tests (interactive)
  npm run test:e2e:ui    # For E2E tests (interactive UI)
`
  }

  return report
}

async function main() {
  const args = process.argv.slice(2)
  const isQuick = args.includes('--quick')
  const isUnitOnly = args.includes('--unit')
  const isE2EOnly = args.includes('--e2e')

  log('\n🧪 Starting Test Suite', colors.blue)
  log('=' .repeat(60))

  let unitResults: TestSummary = { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0, failedTests: [] }
  let e2eResults: TestSummary = { passed: 0, failed: 0, skipped: 0, total: 0, duration: 0, failedTests: [] }

  // Run Unit Tests
  if (!isE2EOnly) {
    const unitCommand = isQuick ? 'npm run test -- tests/unit' : 'npm run test'
    const unit = runCommand(unitCommand, 'Running Unit Tests')

    if (unit.success) {
      log('✅ Unit tests completed', colors.green)
    } else {
      log('⚠️ Some unit tests failed', colors.yellow)
    }

    unitResults = parseVitestOutput(unit.output)
    console.log(unit.output)
  }

  // Run E2E Tests
  if (!isUnitOnly) {
    const e2eCommand = isQuick
      ? 'npx playwright test tests/e2e/navigation.spec.ts tests/e2e/api-health.spec.ts'
      : 'npm run test:e2e'

    const e2e = runCommand(e2eCommand, 'Running E2E Tests')

    if (e2e.success) {
      log('✅ E2E tests completed', colors.green)
    } else {
      log('⚠️ Some E2E tests failed', colors.yellow)
    }

    e2eResults = parsePlaywrightOutput(e2e.output)
    console.log(e2e.output)
  }

  // Generate and print report
  const report = generateReport(unitResults, e2eResults)
  console.log(report)

  // Save report to file
  const reportPath = path.join(process.cwd(), 'test-results', 'summary.txt')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, report)

  log(`\n📄 Report saved to: ${reportPath}`, colors.cyan)

  // Exit with appropriate code
  const allPassed = (unitResults.failed + e2eResults.failed) === 0
  process.exit(allPassed ? 0 : 1)
}

main().catch(console.error)
