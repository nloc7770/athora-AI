# Athora Documentation

## Table of Contents

- [Architecture](./architecture.md) — System overview, tech stack, data flows, and deployment
- [Database Schema](./database-schema.md) — Tables, relationships, constraints, and RLS policies
- [Project Structure](./project-structure.md) — Directory layout, key files, and workspace configuration

## Quick Start

```bash
# Install dependencies
pnpm install

# Run all apps in parallel
pnpm dev

# Run individual apps
pnpm dev:web       # Next.js on port 3000
pnpm dev:backend   # NestJS on port 3001
```

## Monorepo Overview

Athora is a pnpm workspace monorepo with the following packages:

| Package | Description |
|---------|-------------|
| `apps/web` | Next.js 16 web application |
| `apps/backend` | NestJS API server |
| `apps/mobile` | React Native + Expo mobile app |
| `packages/shared` | Shared TypeScript types and interfaces |
