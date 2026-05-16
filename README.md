# E-commerce Order Management Platform

A **microservices project** for managing e-commerce orders end to end: product catalog, shopping cart, checkout, payments, notifications, and admin analytics. The system uses a **React** single-page app, an **API Gateway**, and **nine backend services** talking to **MongoDB** (one database per service) with optional **RabbitMQ** messaging.

---

## Table of contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Microservices](#microservices)
- [Database design](#database-design)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [How to run](#how-to-run)
---

## Overview

| Item | Detail |
|------|--------|
| **Project name** | `ecommerce-order-management-platform` |
| **Type** | Distributed microservices (capstone / portfolio) |
| **Users** | **CUSTOMER** (shop, cart, orders) and **ADMIN** (catalog, inventory, orders, analytics) |
| **Auth** | JWT (HS256) issued by Auth Service, validated at API Gateway and services |
| **Frontend** | http://localhost:5173 |
| **API entry** | http://localhost:8080/api |

**Customer flow:** browse products → add to cart → place order → mock payment → view order status and notifications.

**Admin flow:** manage products and stock, view/update all orders, process refunds, read analytics dashboards.

---

## Architecture

```
┌─────────────────┐
│  React (Vite)   │  :5173
│  frontend-react │
└────────┬────────┘
         │  /api → proxy
         ▼
┌─────────────────┐
│  API Gateway    │  :8080  (Spring Cloud Gateway, JWT on protected routes)
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┬──────────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼          ▼          ▼          ▼
 Auth     User      Product    Inventory   Cart      Order     Payment
 :8081    :8082     :8083      :8084       :3001     :8085     :8086
 (Java)   (Java)    (Java)     (Java)      (Node)    (Java)    (Java)

    ┌──────────────┬──────────────┐
    ▼              ▼              ▼
 Notification   Analytics    RabbitMQ (optional)
 :3002          :8000         :5672 / :15672
 (Node)         (FastAPI)
```

- All browser traffic goes through the **gateway** under `/api/...`.
- Each service owns its **MongoDB database** (logical separation on one Atlas cluster or local `mongod`).
- **Order** and **Payment** services can publish events to **RabbitMQ**; **Notification** service consumes them when enabled.

---

## Microservices

| Service | Port | Stack | Responsibility |
|---------|------|--------|----------------|
| **frontend-react** | 5173 | React 18, Vite, Redux, Tailwind | Storefront UI, admin panels, charts |
| **api-gateway** | 8080 | Spring Cloud Gateway | Route `/api/*`, CORS, JWT validation |
| **auth-service** | 8081 | Spring Boot, MongoDB | Signup, login, JWT issue/validate |
| **user-service** | 8082 | Spring Boot, MongoDB | Profiles and shipping addresses |
| **product-service** | 8083 | Spring Boot, MongoDB | Product catalog CRUD, search (Swagger UI) |
| **inventory-service** | 8084 | Spring Boot, MongoDB | Stock levels, check/reduce/restock |
| **cart-service** | 3001 | Node.js, Express, Mongoose | Per-user shopping cart |
| **order-service** | 8085 | Spring Boot, MongoDB, AMQP | Place orders, status, cancel, events |
| **payment-service** | 8086 | Spring Boot, MongoDB, AMQP | Mock payments and refunds (Swagger UI) |
| **notification-service** | 3002 | Node.js, Express, Mongoose, amqplib | In-app notifications, email simulation |
| **analytics-service** | 8000 | Python, FastAPI, PyMongo | Admin sales and order reports |

**Infrastructure (optional / external):**

| Component | Port | Purpose |
|-----------|------|---------|
| MongoDB | 27017 | Persistence (local or Atlas `mongodb+srv`) |
| RabbitMQ | 5672, 15672 | Async order/payment events (management UI on 15672) |

---

## Database design

**Pattern:** Database-per-service on a shared MongoDB deployment (Atlas or localhost).

| Database | Service | Main collections / data |
|----------|---------|---------------------------|
| `auth_db` | auth-service | Users, credentials, roles |
| `user_db` | user-service | Profiles, addresses |
| `product_db` | product-service | Products, categories |
| `inventory_db` | inventory-service | Stock per product SKU |
| `cart_db` | cart-service | Carts and line items |
| `order_db` | order-service | Orders, line items, status |
| `payment_db` | payment-service | Payment records |
| `notification_db` | notification-service | User notifications |
| `analytics_db` | analytics-service | Aggregates and report data |

Analytics can also read live orders from `order_db` when `ORDER_MONGODB_URI` is set.

**Seed data:** Auth, product, and inventory services seed demo data on startup if collections are empty.

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **UI** | React 18, Vite, React Router, Redux Toolkit, Axios, Tailwind CSS, Recharts, Framer Motion |
| **API Gateway** | Spring Cloud Gateway |
| **Core backends** | Spring Boot 2.7, Spring Data MongoDB, Spring AMQP |
| **Cart & notifications** | Node.js 20, Express, Mongoose, JWT, amqplib |
| **Analytics** | Python 3.12, FastAPI, Uvicorn, PyMongo, python-dotenv |
| **Data** | MongoDB 7 (Atlas or local) |
| **Messaging** | RabbitMQ 3 (optional) |
| **Security** | JWT (HS256), role-based access (CUSTOMER / ADMIN) |
| **Local orchestration** | `npm start` → `scripts/run-local.mjs` (one terminal per service) |

---

## Prerequisites

- **JDK 11+** (17 or 21 recommended) and **Maven**
- **Node.js 20+** and **npm**
- **Python 3.10+** (for analytics)
- **MongoDB** — local `mongod` or **MongoDB Atlas** connection strings
- **RabbitMQ** — only if `RABBITMQ_ENABLED=true` (optional for basic demo)

---

## How to run

From the project root:

```bash
# Install frontend dependencies (first time)
cd frontend-react && npm install && cd ..

# Install Node service dependencies (first time)
cd cart-service && npm install && cd ..
cd notification-service && npm install && cd ..

# Python analytics (first time)
cd analytics-service
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
cd ..

# Start all services (opens one terminal per service on Windows)
npm start
```

Open **http://localhost:5173** for the UI. API base: **http://localhost:8080/api**.

**Frontend only** (if backends already running):

```bash
cd frontend-react
npm run dev
```

**Seed demo users into MongoDB:**

```bash
npm run seed:users
```

**Java build note:** If you see `release version 11 not supported`, set `JAVA_HOME` to JDK 11+ and ensure `java -version` shows 11 or newer.

---

---

## Features summary

- Microservices with clear bounded contexts  
- API Gateway as single entry point  
- JWT authentication and role-based authorization  
- MongoDB database-per-service  
- Optional event-driven notifications via RabbitMQ  
- React admin dashboard with analytics charts  
- Docker-ready service folders (Dockerfiles per service)  
- Demo data seeding for quick evaluation  

---

