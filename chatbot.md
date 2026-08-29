===========================================================
        FOOD WASTE SOLVER — AI CHATBOT ARCHITECTURE
===========================================================

CORE PRINCIPLE:

User
  ↓
Gemini understands WHAT the user wants
  ↓
Backend searches REAL database data
  ↓
Backend returns REAL matching products
  ↓
User sees actual available promotions


IMPORTANT:

❌ Gemini does NOT store products
❌ Gemini does NOT decide whether a product is available
❌ Gemini does NOT invent products
❌ Gemini does NOT directly access or modify the database

✅ Gemini understands natural language
✅ Backend validates the request
✅ Database is the source of truth
✅ Backend returns real available promotions


===========================================================
                    COMPLETE FLOW
===========================================================


STEP 1 — USER SENDS A NATURAL LANGUAGE MESSAGE

Example:

"I have 5000 MMK. What sweet food can I get near me right now?"


                ↓


STEP 2 — FRONTEND SENDS MESSAGE TO BACKEND

React Frontend

POST /api/chat

{
    "message": "I have 5000 MMK. What sweet food can I get near me right now?",
    "userLocation": {
        "latitude": 16.8661,
        "longitude": 96.1951
    }
}


                ↓


STEP 3 — BACKEND SENDS USER MESSAGE TO GEMINI

The backend asks Gemini:

"Analyze this user request and extract search criteria.
Return JSON only.

Possible fields:

- intent
- productName
- category
- maxPrice
- minPrice
- location
- radius
- availableNow
- endingSoon
- sortBy

User message:

'I have 5000 MMK. What sweet food can I get near me right now?'"


                ↓


STEP 4 — GEMINI UNDERSTANDS THE USER INTENT

Gemini returns structured JSON:

{
    "intent": "SEARCH_PROMOTION",
    "productName": null,
    "category": "Dessert",
    "maxPrice": 5000,
    "location": "near_me",
    "radius": 5,
    "availableNow": true,
    "endingSoon": false,
    "sortBy": "price_asc"
}


IMPORTANT:

At this stage, Gemini has NOT searched the products.

Gemini only understands:

WHAT the user wants.


                ↓


STEP 5 — BACKEND VALIDATES GEMINI RESPONSE

Backend checks:

✓ Is the category valid?
✓ Is the price valid?
✓ Is the user location available?
✓ Is the intent supported?
✓ Are the filter values safe?

Example:

If Gemini returns:

"maxPrice": -500

Backend rejects or fixes the invalid value.

Never trust AI output directly.


                ↓


STEP 6 — BACKEND SEARCHES THE DATABASE

Backend creates a database query.

Example logic:

SELECT * FROM promotions
WHERE

status = 'ACTIVE'

AND available_quantity > 0

AND start_time <= CURRENT_TIME

AND due_time > CURRENT_TIME

AND category = 'Dessert'

AND promotion_price <= 5000

ORDER BY promotion_price ASC;


If location is included:

Find shops within the requested radius.


                ↓


STEP 7 — DATABASE RETURNS REAL PRODUCTS

Example:

[
    {
        "id": 101,
        "name": "Chocolate Cake",
        "category": "Dessert",
        "originalPrice": 8000,
        "promotionPrice": 4000,
        "quantity": 3,
        "shop": "Sweet Bakery",
        "location": "Yangon",
        "dueTime": "18:00"
    },

    {
        "id": 102,
        "name": "Fresh Donuts",
        "category": "Dessert",
        "originalPrice": 6000,
        "promotionPrice": 3500,
        "quantity": 5,
        "shop": "Happy Bakery",
        "location": "Yangon",
        "dueTime": "17:30"
    }
]


                ↓


STEP 8 — BACKEND CREATES AI RESPONSE

Option A:

Backend sends the REAL products to Gemini and asks:

"Create a friendly response based ONLY on these products.
Do not mention products that are not included."

Gemini response:

"Great! I found 2 sweet food promotions near you
within your 5,000 MMK budget."


OR


Option B — RECOMMENDED FOR MVP

Backend creates the message itself:

"I found 2 promotions matching your request."


                ↓


STEP 9 — BACKEND RETURNS RESPONSE TO FRONTEND

{
    "message": "Great! I found 2 sweet food promotions near you within your budget.",

    "products": [
        {
            "id": 101,
            "name": "Chocolate Cake",
            "price": 4000,
            "quantity": 3,
            "shop": "Sweet Bakery"
        },

        {
            "id": 102,
            "name": "Fresh Donuts",
            "price": 3500,
            "quantity": 5,
            "shop": "Happy Bakery"
        }
    ]
}


                ↓


STEP 10 — REACT DISPLAYS THE RESPONSE

CHATBOT:

🤖 Great! I found 2 sweet food promotions near you
within your budget.


┌──────────────────────────────┐
│ 🍫 Chocolate Cake            │
│ Sweet Bakery                 │
│                              │
│ ~~8,000 MMK~~  4,000 MMK     │
│ Quantity: 3                  │
│                              │
│ [ View Details ] [ Reserve ] │
└──────────────────────────────┘


┌──────────────────────────────┐
│ 🍩 Fresh Donuts              │
│ Happy Bakery                 │
│                              │
│ ~~6,000 MMK~~  3,500 MMK     │
│ Quantity: 5                  │
│                              │
│ [ View Details ] [ Reserve ] │
└──────────────────────────────┘


===========================================================
                    SYSTEM ARCHITECTURE
===========================================================


                    USER
                     │
                     ▼
             ┌───────────────┐
             │ React Frontend│
             └───────────────┘
                     │
                     │ User Message
                     ▼
             ┌───────────────┐
             │ Spring Backend│
             └───────────────┘
                     │
                     │
                     ├──────────────────┐
                     ▼                  ▼
              ┌────────────┐     ┌─────────────┐
              │ Gemini API │     │ PostgreSQL  │
              └────────────┘     └─────────────┘
                     │                  ▲
                     │                  │
             Understand User        Search Real
                 Intent              Products
                     │                  │
                     └────────┬─────────┘
                              ▼
                    ┌─────────────────┐
                    │ Chat Response   │
                    │ + Product Data  │
                    └─────────────────┘
                              │
                              ▼
                         React UI


===========================================================
              EXAMPLE USER REQUESTS
===========================================================


EXAMPLE 1:

USER:

"What promotions are available now?"


GEMINI OUTPUT:

{
    "intent": "SEARCH_PROMOTION",
    "availableNow": true
}


BACKEND QUERY:

Find all promotions where:

status = ACTIVE
AND quantity > 0
AND start_time <= NOW
AND due_time > NOW


-----------------------------------------------------------


EXAMPLE 2:

USER:

"Show me cheap pizza."


GEMINI OUTPUT:

{
    "intent": "SEARCH_PROMOTION",
    "productName": "pizza",
    "sortBy": "price_asc"
}


BACKEND:

Search the REAL database for pizza promotions.


-----------------------------------------------------------


EXAMPLE 3:

USER:

"What food can I get for under 5000 MMK?"


GEMINI OUTPUT:

{
    "intent": "SEARCH_PROMOTION",
    "maxPrice": 5000,
    "availableNow": true
}


BACKEND:

Search promotions where:

promotion_price <= 5000
AND quantity > 0
AND due_time > NOW


-----------------------------------------------------------


EXAMPLE 4:

USER:

"I want something sweet near me."


GEMINI OUTPUT:

{
    "intent": "SEARCH_PROMOTION",
    "category": "Dessert",
    "location": "near_me",
    "availableNow": true
}


BACKEND:

1. Get user's location.
2. Find nearby shops.
3. Search Dessert promotions.
4. Return real available products.


-----------------------------------------------------------


EXAMPLE 5:

USER:

"What food is ending soon?"


GEMINI OUTPUT:

{
    "intent": "SEARCH_PROMOTION",
    "endingSoon": true,
    "availableNow": true
}


BACKEND:

Search promotions where:

due_time > NOW

AND

due_time <= NOW + 2 HOURS

ORDER BY due_time ASC


===========================================================
              IMPORTANT AI RESPONSE FORMAT
===========================================================


Tell Gemini to ALWAYS return structured JSON.

Example Gemini Prompt:


SYSTEM PROMPT:

You are an AI assistant for a Food Waste Solver application.

Your job is to understand the user's message and extract
search criteria.

DO NOT invent food products.

DO NOT claim that a product exists.

DO NOT search for products yourself.

ONLY identify what the user wants.

Return valid JSON only.

Supported intents:

1. SEARCH_PROMOTION
2. PRODUCT_DETAILS
3. SHOP_INFORMATION
4. GENERAL_QUESTION

Possible search fields:

{
    "intent": "",
    "productName": null,
    "category": null,
    "maxPrice": null,
    "minPrice": null,
    "location": null,
    "radius": null,
    "availableNow": null,
    "endingSoon": null,
    "sortBy": null
}


USER MESSAGE:

{USER_MESSAGE}


===========================================================
              RECOMMENDED API ENDPOINTS
===========================================================


AUTHENTICATION

POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/google


PROMOTIONS

GET    /api/promotions
GET    /api/promotions/{id}
POST   /api/promotions
PUT    /api/promotions/{id}
DELETE /api/promotions/{id}


SEARCH

GET /api/promotions/search


Example:

/api/promotions/search?
product=pizza
&category=FastFood
&maxPrice=5000
&availableNow=true


AI CHAT

POST /api/chat


Request:

{
    "message": "Show me cheap pizza near me",
    "latitude": 16.8661,
    "longitude": 96.1951
}


Response:

{
    "message": "I found 3 cheap pizza promotions near you!",
    "intent": "SEARCH_PROMOTION",
    "products": [],
    "totalResults": 3
}


RESERVATIONS

POST /api/reservations
GET  /api/reservations/my-reservations


SHOPS

GET    /api/shops
GET    /api/shops/{id}
POST   /api/shops
PUT    /api/shops/{id}


FAVORITES

POST   /api/shops/{id}/favorite
DELETE /api/shops/{id}/favorite
GET    /api/favorites


===========================================================
                  BACKEND AI SERVICE
===========================================================


Suggested structure:


ChatController

        ↓

ChatService

        ↓

GeminiService
        │
        └── Understand user message

        ↓

SearchCriteria

        ↓

PromotionService

        ↓

PromotionRepository

        ↓

PostgreSQL Database

        ↓

ChatResponse


===========================================================
                  MOST IMPORTANT RULE
===========================================================


GEMINI = BRAIN FOR UNDERSTANDING LANGUAGE

DATABASE = SOURCE OF TRUTH


The correct responsibility is:


USER:

"Find cheap cake near me."


GEMINI:

"I understand that the user wants:

- Product: Cake
- Price: Cheap
- Location: Near User"


BACKEND:

"I will search the database."


DATABASE:

"Here are the REAL available products."


BACKEND:

"I will return these real products."


FRONTEND:

"I will display the product cards."


===========================================================

FINAL FLOW:

USER MESSAGE
      ↓
GEMINI UNDERSTANDS REQUEST
      ↓
STRUCTURED SEARCH CRITERIA
      ↓
BACKEND VALIDATES CRITERIA
      ↓
DATABASE SEARCH
      ↓
REAL AVAILABLE PRODUCTS
      ↓
BACKEND CREATES RESPONSE
      ↓
CHAT MESSAGE + PRODUCT CARDS
      ↓
USER CAN VIEW DETAILS OR RESERVE
      ↓
WALK-IN PICKUP


===========================================================

GOLDEN RULE:

AI SHOULD NEVER BE THE SOURCE OF TRUTH.

AI UNDERSTANDS.

BACKEND DECIDES.

DATABASE PROVIDES REAL DATA.

===========================================================