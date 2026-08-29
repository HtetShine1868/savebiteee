import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY

const TABLES = [
  'profiles',
  'shops',
  'categories',
  'promotions',
  'reservations',
]

async function probe(label, key) {
  console.log(`\n--- ${label} ---`)

  if (!url || !key) {
    console.log('SKIPPED: url or key not set')
    return
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  for (const table of TABLES) {
    try {
      const { data, count, error } = await client
        .from(table)
        .select('*', { count: 'exact' })
        .limit(3)

      if (error) {
        console.log(
          `  ${table.padEnd(14)} FAIL  [${error.code ?? '-'}] ${error.message}`
        )
      } else {
        console.log(
          `  ${table.padEnd(14)} OK    count=${count} returned=${data.length}`
        )
      }
    } catch (err) {
      console.log(`  ${table.padEnd(14)} THROW ${err.message}`)
    }
  }
}

console.log(`SUPABASE_URL: ${url ?? '(missing)'}`)
console.log(`service role key: ${serviceKey ? 'set' : 'missing'}`)
console.log(`anon key: ${anonKey ? 'set' : 'missing'}`)

await probe('anon key', anonKey)
await probe('service role key', serviceKey)
