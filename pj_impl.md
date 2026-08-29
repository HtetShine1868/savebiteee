# Project Overview: Food Waste Solver App

I want to build a full-stack web application called **Food Waste Solver**, designed to help reduce food waste by connecting food businesses that have products approaching their expiry date with customers who can purchase them at promotional prices.

Before suggesting code or architecture, carefully understand the complete business logic, user roles, features, and workflows described below. Treat this as the project's core requirements.

---

## 🎯 Main Problem

Restaurants, bakeries, supermarkets, cafés, and other food businesses often have food that is still safe to consume but will expire soon. Instead of throwing it away, businesses should be able to promote and sell it quickly at discounted prices.

This application allows:

* **Food Owners/Businesses** to post food promotions before products expire.
* **Users/Customers** to discover nearby discounted food.
* Customers can search and filter available food promotions.
* Customers can use an **AI chatbot as the main discovery feature** to ask naturally about available food.
* The AI understands the user's request and finds matching products from the application's database.
* The system supports **walk-in pickup only**, with no delivery service.

The goal is to reduce food waste while helping customers save money.

---

# 👥 User Roles

The system has two main roles:

## 1. Customer / User

A customer can:

* Register and log in.
* Sign in using Google/Gmail authentication.
* Browse available food promotions.
* Search for food by product name.
* View detailed information about a food promotion.
* View the business/shop profile that posted the promotion.
* Add shops to their favorites.
* Use the AI chatbot to find food promotions using natural language.
* Register/reserve an available promotion for walk-in pickup.
* Receive email notifications about promotions from favorite shops or relevant promotions.

### Important:

This is **walk-in pickup only**. The application does not need delivery functionality.

---

## 2. Food Owner / Business Owner

A business owner can:

* Create an account as an owner.
* Create and manage their business/shop profile.
* Add food products that are approaching their expiry date.
* Create promotional listings for those products.
* Edit or remove their promotions.
* View reservations/orders for their promotions.
* Manage basic information about their business.

### Owner Profile Should Include:

Similar to a simplified Facebook business page:

* Shop/business name
* Profile image
* Cover image (optional)
* Description/About the business
* Shop location
* Contact information
* Food categories or types of products they sell
* Opening hours (optional)

Customers should be able to visit the business profile and favorite the shop.

---

# 🍔 Food Promotion Listing

When a food owner creates a promotion, the system should collect information such as:

* Product name
* Product image
* Description
* Category
* Original price
* Promotion/discounted price
* Available quantity
* Start promotion time
* Promotion due/end time
* Food expiry date/time if applicable
* Shop/business information
* Pickup location

### Promotion Status

The system should automatically determine whether a promotion is:

* **Upcoming** — promotion has not started yet.
* **Active** — currently available.
* **Sold Out** — quantity is zero.
* **Expired** — promotion or food availability has ended.

Expired promotions should not be shown as available to customers.

---

# 🏠 Customer Dashboard

The customer dashboard should display:

## Featured Sections

* 🔥 Available Now
* ⏰ Ending Soon
* 🍔 Food by Category
* 📍 Nearby Promotions
* ⭐ Promotions from Favorite Shops

Each food promotion card should show:

* Food image
* Product name
* Shop name
* Discounted price
* Remaining quantity
* Promotion end time
* Location/distance if location is available

Users can click **View Details** to see complete information.

---

# 🔎 Search and Filtering

Users should be able to search for promotions using:

* Product name
* Category
* Shop name
* Location

Filters may include:

* Food category
* Price range
* Promotion ending soon
* Distance/location
* Availability

Example:

> "Show me discounted pizza."

The system should return matching pizza promotions.

---

# 🤖 AI Chatbot — Main Feature

The AI chatbot is the most important and innovative feature of the application.

Initially, the application will use the **Google Gemini API**.

The chatbot should allow users to ask questions naturally instead of requiring them to manually search and filter.

### Example User Questions

* "What food promotions are available now?"
* "Show me cheap food near me."
* "Do you have any discounted pizza?"
* "What promotions can I get in Yangon right now?"
* "Show me bakery items under 5,000 MMK."
* "What food is ending soon?"
* "Are there any promotions from my favorite shops?"
* "Show me vegetarian food nearby."

The chatbot should understand the user's intent and extract criteria such as:

* Product name or food type
* Category
* Location
* Price range
* Time
* Availability
* Shop preference

### AI Architecture Principle

The Gemini AI model **must not invent products or promotions**.

The correct workflow should be:

1. User sends a natural-language message.
2. Gemini analyzes the message and identifies the user's intent and search criteria.
3. The backend searches the application's database for matching promotions.
4. The backend sends the real matching product information to the AI or formats the results.
5. The chatbot responds using only real data from the database.
6. The UI displays matching food promotion cards directly inside or below the chatbot response.

For example:

**User:**

> "Show me cheap pizza near downtown that is available now."

**AI extracts:**

```json
{
  "product": "pizza",
  "location": "downtown",
  "availableNow": true,
  "sortBy": "lowest_price"
}
```

The backend then searches the database and returns only real matching promotions.

The chatbot can also answer general questions about food listings, categories, promotions, and shop information.

---

# 📍 Location-Based Features

The application should support location-based food discovery.

Users can:

* Allow location access.
* Search for food near a specific location.
* Ask the chatbot for nearby food promotions.

Examples:

> "What food is available near me?"

> "Show me promotions near Yangon."

The system should prioritize nearby shops when location information is available.

Location should be handled with privacy in mind, and users should not be required to share their exact location if they do not want to.

---

# 🛒 Walk-In Reservation / Order System

There is no delivery service.

When a user finds a food promotion, they can reserve/register for it.

The flow should be:

1. User selects a food promotion.
2. User selects the quantity they want, limited by available stock.
3. User confirms the reservation.
4. The system reduces or reserves the available quantity safely.
5. The user receives confirmation.
6. The user visits the physical shop to collect the food.

The system should clearly display:

> 📍 Pickup Only — Please visit the shop to collect your order.

The owner should be able to see incoming reservations and their status.

Possible reservation statuses:

* Reserved
* Picked Up
* Cancelled
* Expired/Not Picked Up

---

# ❤️ Favorite Shops

Users can favorite businesses they like.

Features:

* Add/remove a shop from favorites.
* View favorite shops.
* View promotions from favorite shops.
* Receive notifications when a favorite shop posts a new promotion.

---

# 📧 Email Notifications

When an owner creates a new promotion, the system can notify relevant users by email.

Possible notification rules:

* Notify users who favorited the shop.
* Optionally notify users interested in the same food category.
* Avoid sending unnecessary spam.

Example email:

> 🍕 New Food Promotion Near You!
>
> Your favorite shop, ABC Bakery, has added a new promotion:
> Fresh Pizza — 50% off!
>
> Available until 6:00 PM.
>
> Reserve it now and pick it up at the shop.

For the first version, email notifications can focus primarily on **users who have favorited the shop**.

---

# 🔐 Authentication and Registration

During account creation, users should choose their account type:

### Customer Account

* Can register normally.
* Can sign in using Google/Gmail.
* Can browse, reserve food, favorite shops, and use the chatbot.

### Owner Account

* Registers as a business owner.
* Completes a business profile before posting promotions.
* Can manage promotions and reservations.

The authorization system should ensure that:

* Customers cannot access owner management features.
* Owners cannot manage another owner's products or promotions.
* Admin functionality can be added later.

---

# 🗃️ Main System Data

The database should contain entities similar to:

* Users
* Business Profiles/Shops
* Food Products
* Food Promotions
* Categories
* Reservations/Orders
* Favorites
* Notifications

Relationships should be designed carefully so that:

* One owner can manage one or more shops if supported.
* One shop can have many promotions.
* One promotion belongs to one shop.
* One user can make many reservations.
* Users can favorite many shops.
* Shops can be favorited by many users.

---

# 🔄 Overall Application Flow

```text
FOOD OWNER
    ↓
Creates Business Profile
    ↓
Adds Food Promotion
    ↓
Promotion Becomes Active
    ↓
Appears on Customer Dashboard
    ↓
                    ┌──────────────────┐
                    │ Customer Searches │
                    │ or Uses AI Chat   │
                    └────────┬─────────┘
                             ↓
                    System Finds Matching
                    Real Database Products
                             ↓
                    Customer Views Details
                             ↓
                    Reserves Food
                             ↓
                    Walk-in Pickup
                             ↓
                    Food Waste Reduced ♻️
```

---

# 🤖 AI Chatbot Flow

```text
User Message
     ↓
Gemini AI
(Understand Intent)
     ↓
Extract Search Criteria
     ↓
Backend API
     ↓
Database Search
     ↓
Real Matching Promotions
     ↓
AI/Backend Creates Response
     ↓
Show Answer + Product Cards
```

### Critical Rule:

**Gemini should be used for understanding natural language and generating helpful responses, while the application's backend/database remains the source of truth for product availability, prices, quantities, and promotion details.**

---

# 🎯 MVP Priority

For the first version, prioritize these features:

### Phase 1 — Core Platform

1. Authentication and role selection
2. Owner business profile
3. Create food promotions
4. Customer dashboard
5. Search and category filtering
6. Food promotion details
7. Walk-in reservation

### Phase 2 — AI Feature

8. Gemini-powered chatbot
9. Natural-language product search
10. Location and category-based AI search
11. Display real matching products in chatbot

### Phase 3 — Engagement

12. Favorite shops
13. Email notifications
14. Personalized promotions
15. Advanced location features

---

# 🛠️ Technical Development Principles

When designing this project:

* Keep the architecture simple and suitable for an MVP.
* Build the core CRUD and database functionality before making the AI chatbot complex.
* Keep AI logic separate from core business logic.
* Never let the AI directly modify database data without backend validation.
* Always validate promotion availability and quantity on the backend.
* Prevent expired promotions from being reserved.
* Handle concurrent reservations safely so food quantity cannot become negative.
* Design APIs that can support both the dashboard and AI chatbot.
* Make the UI modern, friendly, and focused on reducing food waste.

---

# 🌱 Final Vision

**Food Waste Solver is not just a food promotion application.**

It is a platform that uses technology and AI to make food discovery easier while helping businesses reduce waste.

Instead of users manually searching through many promotions, they can simply talk to the system:

> "I'm hungry. What affordable food can I get near me right now?"

The AI understands the request, searches real-time promotions, and helps the user find food that would otherwise potentially be wasted.

The ultimate goal is:

**Save Food. Save Money. Reduce Waste. ♻️**

Please use these requirements as the complete context for understanding the project. Before generating a large amount of code, first analyze the system architecture, database design, user flows, API structure, and AI integration strategy. Recommend a practical MVP architecture and identify any potential problems or improvements in the requirements.
