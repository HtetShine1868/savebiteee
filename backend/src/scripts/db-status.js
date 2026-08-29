import 'dotenv/config'
import pg from 'pg'

const TABLES = [
  'profiles',
  'shops',
  'categories',
  'promotions',
  'reservations',
  'shop_favorites',
  'notification_log',
]

async function main() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('DATABASE_URL is missing. Add the Supabase connection string to backend/.env')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    for (const table of TABLES) {
      const result = await client
        .query(`select count(*)::int as count from public.${table}`)
        .catch((error) => ({ error }))

      console.log(
        result.error
          ? `${table.padEnd(18)} missing (${result.error.message})`
          : `${table.padEnd(18)} ${result.rows[0].count} rows`
      )
    }

    const columns = await client.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'profiles'
       order by ordinal_position`
    )
    console.log('\nprofiles columns:', columns.rows.map((row) => row.column_name).join(', '))
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('Database check failed:', error.message)
  process.exit(1)
})
