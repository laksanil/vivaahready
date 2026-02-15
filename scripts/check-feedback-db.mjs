import { PrismaClient } from '@prisma/client'

const source = process.argv[2] || 'unknown'
const required = ['userPhone', 'userPhoneLast4', 'userId', 'overallStars', 'primaryIssue', 'stepBData']

const prisma = new PrismaClient()

try {
  const table = await prisma.$queryRawUnsafe(
    "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Feedback') AS exists"
  )
  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='Feedback' ORDER BY ordinal_position"
  )

  const colNames = cols.map((c) => c.column_name)
  const missing = required.filter((c) => !colNames.includes(c))

  console.log(JSON.stringify({
    source,
    tableExists: Boolean(table?.[0]?.exists),
    requiredMissing: missing,
    columnsCount: colNames.length,
  }, null, 2))
} catch (error) {
  console.error(JSON.stringify({
    source,
    error: error?.message || String(error),
  }, null, 2))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
