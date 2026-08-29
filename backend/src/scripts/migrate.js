import 'dotenv/config'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = path.dirname(fileURLToPath(import.meta.url))
const supabaseDir = path.resolve(here, '../../supabase')

async function collectFiles() {
  const files = [path.join(supabaseDir, 'schema.sql')]
  const migrationsDir = path.join(supabaseDir, 'migrations')

  const entries = await readdir(migrationsDir).catch(() => [])
  for (const entry of entries.filter((name) => name.endsWith('.sql')).sort()) {
    files.push(path.join(migrationsDir, entry))
  }

  return files
}

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('DATABASE_URL is missing. Add the Supabase connection string to backend/.env')
    process.exit(1)
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()

  try {
    for (const file of await collectFiles()) {
      const sql = await readFile(file, 'utf8')
      process.stdout.write(`Applying ${path.basename(file)} ... `)
      await client.query(sql)
      console.log('done')
    }
  } finally {
    await client.end()
  }

  console.log('Database is up to date.')
}

main().catch((error) => {
  console.error('\nMigration failed:', error.message)
  process.exit(1)
})
