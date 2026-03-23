# Rental Management System (RMS)
A multi-tenant SaaS for property managers in Kenya. Built with Next.js App Router, NestJS, and Prisma.

## Local Setup
1. Copy `.env.example` to `.env` in both `apps/api` and `apps/web`.
2. Run `docker compose up -d` to start Postgres, Redis, and the backend.
3. Run `npm install` and `npm run db:push` / `npm run db:seed`.
4. Run `npm run dev` to start the frontend and backend in development mode.