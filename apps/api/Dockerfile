# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files for workspace resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install all dependencies (including devDependencies for building)
RUN npm ci --workspace=apps/api --include-workspace-root

# Copy the API source code and Prisma schema
COPY apps/api ./apps/api

# Generate Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the NestJS application
RUN npm run build --workspace=apps/api

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm ci --workspace=apps/api --include-workspace-root --omit=dev

# Copy Prisma schema and generate client for production
COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Copy built output from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
