# ADR 0001: Monorepo Tooling, Package Boundaries, and Workspace Architecture

## Status
Accepted

## Context
PawStay is a production-grade two-sided pet care marketplace requiring coordinated code sharing across web client applications, server routes, background job workers, database access layers, and domain logic. A monolithic single-package architecture quickly suffers from circular dependencies, slow builds, and leaky abstractions. Conversely, multi-repo architectures introduce versioning overhead and complex synchronization.

## Decision
We adopt a **pnpm workspaces monorepo** with strict architectural boundaries:
- `apps/web`: Next.js 14+ App Router for customer and sitter web interfaces, public landing pages, and admin operations.
- `apps/worker`: Node/TypeScript service powered by Redis and BullMQ for asynchronous jobs (booking expiry sweeps, review revelation, scheduled 24h payouts, ledger reconciliation, notifications).
- `packages/db`: Prisma ORM client with PostgreSQL schema and PostGIS extensions.
- `packages/shared`: Pure domain logic, Zod validation schemas, domain types, financial constants, state machine rules, and ranking algorithms with zero framework lock-in.
- `packages/config`: Centralized TypeScript and tooling configs.

## Consequences
- **Positive**: High code reuse, atomic commits across front-end and back-end domain contracts, fast and disk-efficient package caching with pnpm.
- **Negative**: Requires strict discipline to ensure `packages/shared` remains pure and never imports Node- or web-specific runtimes.
