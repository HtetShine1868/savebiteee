import 'dotenv/config'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set in backend/.env')
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('Postgres connection: OK')

  const version = await client.query('select version()')
  console.log(`server: ${version.rows[0].version.split(',')[0]}`)

  const tables = await client.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
     order by table_name`
  )
  console.log(
    `public tables (${tables.rowCount}): ${
      tables.rows.map((r) => r.table_name).join(', ') || '(none)'
    }`
  )
} catch (err) {
  console.error(`Postgres connection: FAILED — ${err.message}`)
  process.exitCode = 1
} finally {
  await client.end()
}
