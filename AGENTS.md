# Repository Guidelines

## Project Structure & Module Organization
backend/services-v2 houses all Clean Architecture services (domain/application/infrastructure/presentation). Completed services: identity-service, patient-registry-service, provider-staff-service; in-progress modules mirror the same layout. Shared primitives live in backend/services-v2/shared. Frontend code remains under frontend/ pending V2 migration. Tests sit inside each service's tests directory with unit/integration splits.

## Build, Test, and Development Commands
From backend/services-v2 run `npm run dev:core` to boot Redis, RabbitMQ, and the three production-ready services via Docker Compose. Use `npm run dev:all` to include WIP services; `npm run dev:clean` drops containers/volumes for a clean slate. Build every service with `npm run build:all`; to work on one service, cd into it and run `npm run dev`. Run the global health check script via `npm run health:check` when validating the stack after deploys.

## Coding Style & Naming Conventions
Code is TypeScript-first with strict settings; prefer interfaces over `any`. Follow Prettier defaults (2-space indentation, single quotes) and run `npm run format` inside each service before commits. Keep domain types PascalCase, variables camelCase, environment variables UPPER_SNAKE_CASE, and REST endpoints kebab-case. Respect Clean Architecture boundaries: no infrastructure imports inside domain or application folders.

## Testing Guidelines
Jest drives testing; unit suites live under `tests/unit`, integration under `tests/integration`, and filenames use `*.test.ts`. Target >=90% coverage for domain logic and include regression cases for security-sensitive flows (auth, permissions, billing). Execute `npm run test:all` at the monorepo root before merging; when iterating locally, scope with service-specific scripts such as `npm run test:identity`. Add fixtures under `tests/fixtures` and avoid hitting Supabase directly - mock through interfaces.

## Commit & Pull Request Guidelines
Commits should stay atomic, follow imperative tone, and prefer Conventional Commit prefixes (`feat(patient-registry): ...`, `fix(identity): ...`). Reference ticket IDs in the footer when applicable and avoid bundling unrelated services. Pull requests must describe the motivation, summarize architectural impacts, list testing evidence (`npm run test:identity`, screenshots for frontend), and tag reviewers who own affected services. Include risk/rollback notes whenever schema or infrastructure changes ship.

## Security & Configuration Tips
Store secrets exclusively in `.env` files under backend/services-v2 and never commit them; sample values exist in documentation. Rotate Supabase service keys after staging deployments and validate JWT-related changes against the identity-service password policy tests. Rate limiting and CORS defaults live in `identity-service/src/main.ts`; adjust via environment variables rather than hardcoding.
