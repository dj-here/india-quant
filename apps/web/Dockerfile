# Production Dockerfile for @pawstay/web (Next.js 14 App Router)
FROM node:20-alpine AS base

# Install pnpm and dependencies needed for node-gyp if any
RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
RUN apk add --no-cache libc6-compat openssl

# ------------------------------------------------------------------------------
# Dependencies Stage
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

# Copy root workspace and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma/
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/

# Install dependencies (fetch cache)
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# Builder Stage
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/config ./packages/config
COPY --from=deps /app/packages/db ./packages/db
COPY --from=deps /app/packages/shared ./packages/shared
COPY --from=deps /app/apps/web ./apps/web
COPY . .

# Generate Prisma Client & compile shared package
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @pawstay/db generate
RUN pnpm --filter @pawstay/shared build
RUN pnpm --filter @pawstay/web build

# ------------------------------------------------------------------------------
# Production Runner Stage
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create unprivileged system user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy runtime assets and built application
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["pnpm", "--filter", "@pawstay/web", "start"]
