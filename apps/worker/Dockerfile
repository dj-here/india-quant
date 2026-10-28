# Production Dockerfile for @pawstay/worker (BullMQ Background Jobs)
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
RUN apk add --no-cache libc6-compat openssl

# ------------------------------------------------------------------------------
# Dependencies Stage
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma/
COPY packages/shared/package.json ./packages/shared/
COPY apps/worker/package.json ./apps/worker/

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
COPY --from=deps /app/apps/worker ./apps/worker
COPY . .

ENV NODE_ENV=production

RUN pnpm --filter @pawstay/db generate
RUN pnpm --filter @pawstay/shared build
RUN pnpm --filter @pawstay/worker build

# ------------------------------------------------------------------------------
# Runner Stage
# ------------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 workerjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /app/package.json ./package.json

USER workerjs

CMD ["node", "apps/worker/dist/index.js"]
