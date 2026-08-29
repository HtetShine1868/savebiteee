/**
 * Demo data for testing and presentations.
 *
 *   npm run db:seed
 *
 * Every account uses the password "demo1234". Running it again wipes the
 * previous demo rows first, so it is safe to repeat. Real accounts are left
 * untouched — demo emails all end in ".demo".
 */

import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'

const PASSWORD = 'demo1234'
const HOURS = 60 * 60 * 1000

const SHOPS = [
  {
    email: 'owner@sweetcrumb.demo',
    ownerName: 'Thida Win',
    name: 'Sweet Crumb Bakery',
    description:
      'Small-batch bakery in Hledan. Everything left after 6pm goes out at rescue prices.',
    address: '42 Hledan Road, Kamayut',
    city: 'Yangon',
    latitude: 16.8253,
    longitude: 96.129,
    phone: '+95 9 770 111 222',
    categories: ['bakery', 'desserts'],
    openingHours: { weekdays: '07:00 - 20:00', weekends: '08:00 - 21:00' },
  },
  {
    email: 'owner@yangonpizza.demo',
    ownerName: 'Kyaw Zin',
    name: 'Yangon Pizza Kitchen',
    description: 'Wood-fired pizza in Sanchaung. Whole pies discounted before closing.',
    address: '18 Baho Road, Sanchaung',
    city: 'Yangon',
    latitude: 16.818,
    longitude: 96.135,
    phone: '+95 9 770 333 444',
    categories: ['pizza', 'drinks'],
    openingHours: { weekdays: '11:00 - 22:00', weekends: '11:00 - 23:00' },
  },
  {
    email: 'owner@goldenwok.demo',
    ownerName: 'Mya Thet',
    name: 'Golden Wok',
    description: 'Home-style Shan and Chinese cooking. Lunch trays are half price after 2pm.',
    address: '215 Anawrahta Road, Downtown',
    city: 'Yangon',
    latitude: 16.78,
    longitude: 96.16,
    phone: '+95 9 770 555 666',
    categories: ['asian', 'vegetarian'],
    openingHours: { weekdays: '10:00 - 21:00', weekends: '10:00 - 21:00' },
  },
  {
    email: 'owner@greenbasket.demo',
    ownerName: 'Nilar Aung',
    name: 'Green Basket Grocery',
    description: 'Neighbourhood grocer. Ripe produce and short-dated stock, priced to move.',
    address: '7 Insein Road, Kamayut',
    city: 'Yangon',
    latitude: 16.83,
    longitude: 96.14,
    phone: '+95 9 770 777 888',
    categories: ['groceries', 'vegetarian'],
    openingHours: { weekdays: '08:00 - 20:00', weekends: '08:00 - 18:00' },
  },
]

/**
 * `startsIn` / `endsIn` are hours relative to now, so the seed always produces
 * a live board: things ending soon, things still open, one upcoming, one sold out.
 */
const PROMOTIONS = [
  {
    shop: 'Sweet Crumb Bakery',
    category: 'bakery',
    productName: 'Butter croissant box (6 pcs)',
    description: 'Baked this morning, still flaky. Best eaten today.',
    originalPrice: 9000,
    promoPrice: 2800,
    quantity: 5,
    startsIn: -2,
    endsIn: 1.5,
    pickupLocation: 'Front counter',
  },
  {
    shop: 'Sweet Crumb Bakery',
    category: 'desserts',
    productName: 'Chocolate mousse cups (2 pcs)',
    description: 'Made yesterday evening, perfect tonight.',
    originalPrice: 6000,
    promoPrice: 2500,
    quantity: 8,
    startsIn: -3,
    endsIn: 5,
    pickupLocation: 'Front counter',
  },
  {
    shop: 'Sweet Crumb Bakery',
    category: 'bakery',
    productName: 'Sourdough loaf',
    description: 'Yesterday’s bake. Excellent toasted.',
    originalPrice: 5000,
    promoPrice: 1800,
    quantity: 0,
    startsIn: -6,
    endsIn: 3,
    pickupLocation: 'Front counter',
  },
  {
    shop: 'Yangon Pizza Kitchen',
    category: 'pizza',
    productName: 'Margherita pizza (12 inch)',
    description: 'Fresh out of the oven, unsold from the dinner rush.',
    originalPrice: 12000,
    promoPrice: 4500,
    quantity: 4,
    startsIn: -1,
    endsIn: 2,
    pickupLocation: 'Takeaway window',
  },
  {
    shop: 'Yangon Pizza Kitchen',
    category: 'pizza',
    productName: 'Pepperoni slices (4 pcs)',
    description: 'Reheat for two minutes and they are as good as new.',
    originalPrice: 8000,
    promoPrice: 2800,
    quantity: 6,
    startsIn: -1,
    endsIn: 4,
    pickupLocation: 'Takeaway window',
  },
  {
    shop: 'Yangon Pizza Kitchen',
    category: 'drinks',
    productName: 'Fresh lime soda (2 bottles)',
    description: 'Bottled today. Best before tomorrow morning.',
    originalPrice: 3000,
    promoPrice: 1200,
    quantity: 10,
    startsIn: -1,
    endsIn: 6,
    pickupLocation: 'Takeaway window',
  },
  {
    shop: 'Golden Wok',
    category: 'asian',
    productName: 'Shan noodle tray (serves 2)',
    description: 'Cooked at lunch, still warm and ready to collect.',
    originalPrice: 7000,
    promoPrice: 2500,
    quantity: 3,
    startsIn: -2,
    endsIn: 1,
    pickupLocation: 'Counter, ask for the rescue tray',
  },
  {
    shop: 'Golden Wok',
    category: 'vegetarian',
    productName: 'Tofu and vegetable stir-fry',
    description: 'Vegan. Made this afternoon.',
    originalPrice: 6500,
    promoPrice: 2200,
    quantity: 5,
    startsIn: -2,
    endsIn: 4,
    pickupLocation: 'Counter, ask for the rescue tray',
  },
  {
    shop: 'Golden Wok',
    category: 'asian',
    productName: 'Fried rice family pack',
    description: 'Tomorrow’s lunch special, reserve now and collect from 11am.',
    originalPrice: 10000,
    promoPrice: 4000,
    quantity: 6,
    startsIn: 3,
    endsIn: 9,
    pickupLocation: 'Counter, ask for the rescue tray',
  },
  {
    shop: 'Green Basket Grocery',
    category: 'groceries',
    productName: 'Ripe banana bundle (1 kg)',
    description: 'Perfectly ripe today — great for shakes and baking.',
    originalPrice: 4000,
    promoPrice: 1500,
    quantity: 12,
    startsIn: -4,
    endsIn: 5,
    pickupLocation: 'Produce aisle',
  },
  {
    shop: 'Green Basket Grocery',
    category: 'vegetarian',
    productName: 'Mixed salad box',
    description: 'Prepared this morning. Short-dated but crisp.',
    originalPrice: 5500,
    promoPrice: 2000,
    quantity: 7,
    startsIn: -3,
    endsIn: 2.5,
    pickupLocation: 'Chiller, front of store',
  },
  {
    shop: 'Green Basket Grocery',
    category: 'groceries',
    productName: 'Yoghurt 4-pack',
    description: 'Best before tomorrow. Still perfectly good.',
    originalPrice: 6000,
    promoPrice: 2400,
    quantity: 9,
    startsIn: -5,
    endsIn: 7,
    pickupLocation: 'Chiller, front of store',
  },
]

const CUSTOMERS = [
  {
    email: 'customer@savebite.demo',
    fullName: 'Aye Chan',
    city: 'Yangon',
    latitude: 16.8261,
    longitude: 96.1291,
    favorites: ['Sweet Crumb Bakery', 'Yangon Pizza Kitchen'],
  },
  {
    email: 'thura@savebite.demo',
    fullName: 'Thura Kyaw',
    city: 'Yangon',
    latitude: 16.7955,
    longitude: 96.1502,
    favorites: ['Golden Wok'],
  },
]

function iso(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * HOURS).toISOString()
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is missing. Add the Supabase connection string to backend/.env')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
  await client.connect()

  try {
    await client.query('begin')

    // Demo accounts only — anything without a ".demo" email is left alone.
    await client.query(
      `delete from public.reservations
       where customer_id in (select id from public.profiles where email like '%.demo')`
    )
    const removed = await client.query("delete from public.profiles where email like '%.demo'")
    console.log(`cleared ${removed.rowCount} previous demo account(s)`)

    const passwordHash = await bcrypt.hash(PASSWORD, 10)
    const { rows: categories } = await client.query('select id, slug from public.categories')
    const categoryId = Object.fromEntries(categories.map((row) => [row.slug, row.id]))

    const shopIds = {}
    for (const shop of SHOPS) {
      const { rows: ownerRows } = await client.query(
        `insert into public.profiles
           (email, password_hash, auth_provider, role, full_name, city, latitude, longitude)
         values ($1, $2, 'password', 'owner', $3, $4, $5, $6)
         returning id`,
        [shop.email, passwordHash, shop.ownerName, shop.city, shop.latitude, shop.longitude]
      )

      const { rows: shopRows } = await client.query(
        `insert into public.shops
           (owner_id, name, slug, description, address, city, latitude, longitude,
            contact_phone, contact_email, categories, opening_hours)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         returning id`,
        [
          ownerRows[0].id,
          shop.name,
          shop.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          shop.description,
          shop.address,
          shop.city,
          shop.latitude,
          shop.longitude,
          shop.phone,
          shop.email,
          shop.categories,
          shop.openingHours,
        ]
      )

      shopIds[shop.name] = shopRows[0].id
    }
    console.log(`created ${SHOPS.length} shops with owner accounts`)

    const promotionIds = {}
    for (const promotion of PROMOTIONS) {
      const { rows } = await client.query(
        `insert into public.promotions
           (shop_id, category_id, product_name, description, original_price, promo_price,
            quantity_available, starts_at, ends_at, pickup_location)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         returning id`,
        [
          shopIds[promotion.shop],
          categoryId[promotion.category] ?? null,
          promotion.productName,
          promotion.description,
          promotion.originalPrice,
          promotion.promoPrice,
          promotion.quantity,
          iso(promotion.startsIn),
          iso(promotion.endsIn),
          promotion.pickupLocation,
        ]
      )

      promotionIds[promotion.productName] = rows[0].id
    }
    console.log(`published ${PROMOTIONS.length} promotions`)

    const customerIds = {}
    for (const customer of CUSTOMERS) {
      const { rows } = await client.query(
        `insert into public.profiles
           (email, password_hash, auth_provider, role, full_name, city, latitude, longitude)
         values ($1, $2, 'password', 'customer', $3, $4, $5, $6)
         returning id`,
        [
          customer.email,
          passwordHash,
          customer.fullName,
          customer.city,
          customer.latitude,
          customer.longitude,
        ]
      )

      customerIds[customer.email] = rows[0].id

      for (const shopName of customer.favorites) {
        await client.query(
          `insert into public.shop_favorites (user_id, shop_id) values ($1, $2)
           on conflict do nothing`,
          [rows[0].id, shopIds[shopName]]
        )
      }
    }
    console.log(`created ${CUSTOMERS.length} customer accounts with favourites`)

    // Reserve through the SQL function so stock and pickup codes behave exactly
    // as they do in the app.
    const openReservation = await client.query('select public.reserve_promotion($1, $2, $3) as row', [
      promotionIds['Pepperoni slices (4 pcs)'],
      customerIds['customer@savebite.demo'],
      2,
    ])
    const collected = await client.query('select public.reserve_promotion($1, $2, $3) as row', [
      promotionIds['Chocolate mousse cups (2 pcs)'],
      customerIds['thura@savebite.demo'],
      1,
    ])
    await client.query(
      `update public.reservations set status = 'picked_up' where id = $1`,
      [collected.rows[0].row.id]
    )

    console.log(
      `reserved 2 orders (pickup code ${openReservation.rows[0].row.pickup_code}, one marked collected)`
    )

    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }

  console.log(`\nDemo accounts — password for all of them: ${PASSWORD}`)
  console.log('  shop owner:  owner@sweetcrumb.demo (Sweet Crumb Bakery)')
  console.log('  shop owner:  owner@yangonpizza.demo (Yangon Pizza Kitchen)')
  console.log('  customer:    customer@savebite.demo')
}

main().catch((error) => {
  console.error('\nSeed failed:', error.message)
  process.exit(1)
})
