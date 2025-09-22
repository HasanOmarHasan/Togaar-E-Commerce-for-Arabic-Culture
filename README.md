# 🛒 Togaar is E-COMMERCE PLATFORM (Arabic-Centric) v1.0 

## 📑 Table of Contents
- [API Documentation](#-api-documentation)
- [Vision](#-vision)
- [Business Logic](#-business-logic)
- [Features](#-features)
- [Performance Results](#-performance-results)
- [Security & Protection](#-security--protection)
- [Tech Stack](#-tech-stack)
- [The Journey](#-the-journey)
- [About Me](#-about-me)


## API Documentation

### Base URL
Production: `https://togaar-e-commerce-for-arabic-culture-production.up.railway.app`  
Development: `http://localhost:3000`

### Postman Collection
👉 [Open Postman Collection](https://documenter.getpostman.com/view/32860449/2sB3HtFcZn)


<!-- [![Run in Postman](https://run.pstmn.io/button.svg)](https://documenter.getpostman.com/view/32860449/2sB3HtFcZn) -->
[![Run in Postman](https://img.shields.io/badge/Postman-Collection-orange?logo=postman)](https://www.postman.com/your-workspace/collections/your-collection-id)


## 🌍 Vision

This project is not just another e-commerce backend — it is built to **reflect Arab identity, culture, and traditions**.  
From the way people shop, to the way they interact, the platform is designed with our context in mind.

- Support for **dialects** like **Egyptian Arabic**, alongside **Modern Standard Arabic** and **English**.
- Inspired by Arab shopping traditions: before buying, people ask **family and friends**.  
  That’s why I integrated an **AI assistant** that allows customers to compare products, get recommendations, and receive guidance in their own language.

---

## 🧩 Business Logic

- **Multi-language & Dialects**: Arabic (MSA), Egyptian dialect, and English.
- **AI-powered chatbot**: Helps users compare products, understand needs, and make better purchase decisions.
- **Ask your friends** logic: Users can share links or recommendations before finalizing a purchase.
- **Discount by generosity**: After purchasing, a user receives a coupon to share with three friends — reflecting the Arab tradition of generosity.
- **Role-based recommendations**: Personalized product suggestions based on roles and behavior.
- **Caching system**: In-memory cache to reduce DB load and improve speed.

---

## 🚀 Features

- **Core E-Commerce**
  - **CRUD operations for** Products, Categories, Subcategories, , Brands and etc , with usage of GET requests (pagination, filters, sorting, field selection , search ).
  - **Image upload with automatic optimization** (reduced size, enhanced quality) using custom middleware.
  - save the importent resource by add limit in number of requests per minutes ex (chatBot and send Email)
- **Authentication & Authorization**:
  - Secure authentication with JWT (Access & Refresh tokens).
  - Role-based authorization (Admin, Manager, User).
  - Account lifecycle: Deactivate, Reactivate, and Delete after grace period.
  - Brute-force protection with rate limiting and attempt cooldown .
  

* **Shopping Experience**
  - **Wishlist** and **Reviews** with helpful votes and reports.
  - **User addresses** with CRUD management.
  - **Shopping Cart** with intelligent quantity handling and coupon integration.
  - **Order & Payment**: Cash on delivery + Online payments via Stripe.
  - Coupons with usage limits and expiry rules.

- **AI & Real-Time Support**
  - **AI Shopping Assistant** : helps users compare products and get personalized advice in Arabic, English, and even Egyptian dialect 🇪🇬.
  - **Customer Support Chat** via **Socket.io**: users can create tickets, chat with support agents, and track issue progress in real time.

- **Localization & Culture-First Design**
  - Multi-language & dialect support: Arabic (Fusha + Egyptian) and English.
  - Designed for **Arab shopping culture**: users can ask AI before buying, share products with family/friends for advice, and get special referral discounts.

- **Caching & Performance**
  - In-memory caching (LRU strategy) to reduce database load.
  - Context-aware caching for users and products.
  - Role-based product recommendations .

- **Business Logic Innovations**
  - Coupons that reward **user’s friends** (social shopping experience).
  - Grace period for account deletion (inspired by Twitter/Meta).

---

## ⚡ Performance Results

I focused heavily on **optimizing performance** to make the platform fast and scalable:

- **Chatbot response time**:
  - Before: ~6 seconds
  - After: **~3 seconds average** (50% faster)
  - Optimized using **caching + prompt engineering**.

- **Product Aggregation Queries**:
  - Before: ~1.5 seconds
  - After: **~30ms average** (95% faster)
  - Achieved via **MongoDB indexes + in-memory caching + query refactoring**.

- **Image Handling**:
  - Custom middleware compresses and optimizes uploaded images.
  - Reduced image size while improving quality → faster product page loads.

---

## 🛡️ Security & Protection

- **Brute force prevention**: login and password reset attempts limited with cooldowns
- **Request limiting**: IP-based rate limiting with `express-rate-limit`.
- **OTP  (One-Time Password / Code) verification**: Two-factor authentication.
- **JWT with refresh tokens** for secure session management.
- **Account deactivation flow** with reactivation option before permanent deletion.
- **Validation** for all critical inputs (emails, passwords, product data , ...etc).
- **Password encryption**: Bcrypt for secure password storage.
- **Error handling**: Custom error responses for better user experience.
- **Cors**: Cross-Origin Resource Sharing (CORS) for secure communication between different origins.

---

## 🛠️ Tech Stack

- **Node.js / Express.js**
- **MongoDB + Mongoose**
- **JWT / Cookies**
- **Socket.io**
- **Stripe API**
- **AI Integration** (Gemini API for chatbot)
- **i18next** for internationalization and
- **LRU-cache** for in-memory caching


![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-5.x-lightgrey?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen?logo=mongodb)
![Stripe](https://img.shields.io/badge/Stripe-Payments-blue?logo=stripe)

---

## 📖 The Journey

This project is the result of **12 weeks of backend work**, challenges, refactoring, and learning.  
From struggling with non-working endpoints, to fixing critical bugs, to improving performance step by step.

Some highlights of the journey:

- Solving **hidden bugs** that blocked development for days.
- Refactoring repeated code to make it modular and scalable.
- Writing daily reports of progress, failures, and breakthroughs.
- Shifting focus from just _building features_ to improving **performance, security, and cultural relevance**.

This is more than just code — it’s a **story of building an Arab-first e-commerce experience**.

---

## 👨‍💻 About Me

I’m passionate about building software that reflects our **culture and identity**, while staying at the highest standards of **security, performance, and scalability**.

📩 If you’re interested in collaboration or freelance work, feel free to reach out! ✨
