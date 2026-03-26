# Rental Management System (RMS)

A multi-tenant SaaS platform for Kenyan property managers, built with **NestJS** (API) and **Next.js** (web dashboard). Manages properties, units, renters, rental agreements, invoicing, M-Pesa payments, and owner disbursements.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React, TailwindCSS, Zustand, React Query |
| **Backend** | NestJS 11, Prisma ORM, PostgreSQL, BullMQ (Redis) |
| **Payments** | Safaricom Daraja API (M-Pesa STK Push) |
| **SMS** | Africa's Talking |
| **Email** | Nodemailer (SMTP) |
| **Infra** | Docker Compose, GitHub Actions CI |

## Project Structure

```
rental-management-system/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   ├── web/          # Next.js frontend (port 3000)
│   └── docs/         # Documentation app
├── packages/         # Shared packages
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- **Node.js** 20+
- **Docker** & **Docker Compose** (for PostgreSQL + Redis)
- **npm** (for workspace management)

## Local Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd rental-management-system
npm install
```

### 2. Start Infrastructure

```bash
docker compose up -d   # Starts PostgreSQL (port 5433) and Redis (port 6379)
```

### 3. Configure Environment Variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit the `.env` files with your credentials. See the `.env.example` files for all required variables.

### 4. Database Setup

```bash
# Generate Prisma Client
npm run db:generate --workspace=apps/api

# Run migrations
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma

# Seed the database with demo data
npm run seed --workspace=apps/api
```

Default login after seeding: `admin@agency.com` / `password123`

### 5. Start Development

```bash
# Start both API and Web in dev mode
npx turbo dev

# Or start individually:
npm run start:dev --workspace=apps/api    # API on http://localhost:3001
npm run dev --workspace=apps/web          # Web on http://localhost:3000
```

API docs available at: `http://localhost:3001/api/docs` (Swagger)

## Docker (Full Stack)

```bash
# Start everything (PostgreSQL, Redis, API)
docker compose up -d

# Start the web app separately
npm run dev --workspace=apps/web
```

## Key Features

- **Multi-tenancy**: Each landlord/agency operates in an isolated tenant
- **Property Management**: Properties → Units → Renters → Agreements
- **Automated Invoicing**: Monthly cron job generates rent invoices
- **M-Pesa Payments**: STK Push integration with Safaricom Daraja API
- **SMS Notifications**: Automated invoice & payment SMS via Africa's Talking
- **Owner Portal**: Property owners can view their portfolio and disbursements
- **Team Management**: Invite team members with role-based access
- **Reports**: Revenue, occupancy, and financial reports
- **Maintenance Tracking**: Submit/track maintenance requests with file uploads

## Environment Variables

See `apps/api/.env.example` and `apps/web/.env.example` for the complete list of required environment variables.

## Testing

```bash
# Run all tests
npm run test --workspaces

# Run API tests only
npm run test --workspace=apps/api
```

## License

UNLICENSED — Private project.
