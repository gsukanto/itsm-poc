# ITSM (ITIL 4) Platform

> **Status: proof-of-concept.** Functional end-to-end but not production-hardened. Use at your own risk.

A self-hosted IT Service Management platform inspired by BMC Helix ITSM (Remedy), built on the Azure stack. Web + REST API only. Single-tenant, MVP-quality, full ITIL 4 process suite.

## Stack
- **API & Worker**: NestJS (TypeScript), Prisma ORM
- **Web**: React + Vite + TypeScript + MUI + RTK Query
- **DB**: Azure SQL (SQL Server 2022 locally)
- **Storage**: Azure Blob Storage (Azurite locally)
- **Messaging**: Azure Service Bus (in-memory fallback locally)
- **Auth**: Microsoft Entra ID (OIDC + JWT)
- **Observability**: Application Insights
- **IaC**: Bicep
- **CI/CD**: GitHub Actions

## Modules (full ITIL 4)
Incident · Service Request + Catalog · Problem · Change Enablement · CMDB · Knowledge · SLM · Event · Availability · Capacity · Release & Deployment · Asset · Service Continuity · Supplier · Service Financial (light)

## Repo layout
```
apps/
  api/        NestJS REST API
  worker/     NestJS background worker
  web/        React (Vite) SPA
packages/
  shared/     shared DTOs, schemas, enums
  ui/         shared React components
prisma/       schema + migrations
infra/        Bicep modules + main.bicep
```

## Local dev
Prereqs: Node 20+, pnpm 9+, Docker.

```bash
pnpm install
cp .env.example .env
docker compose up -d            # SQL Server, Azurite, MailHog
pnpm prisma:migrate             # apply migrations
pnpm prisma:seed                # base seed (users, priorities, categories)
pnpm prisma:seed:bulk           # optional: 100 records per module
pnpm dev                        # start api, worker, web in parallel
```

- API:    http://localhost:3000  (OpenAPI at /api/docs)
- Web:    http://localhost:5173
- MailHog UI: http://localhost:8025

> **Security note:** `.env.example` ships placeholder dev secrets (e.g. `JWT_DEV_SECRET=dev-only-change-me`). They exist purely to make local boot frictionless — **never reuse them in any deployed environment**. For real deployments, configure Microsoft Entra ID and store secrets in Key Vault.

## CI
GitHub Actions runs lint, test, build on every PR. `infra/` Bicep is what-if'd on PR and deployed on push to `main` (when secrets configured).

## License
[MIT](./LICENSE) — see LICENSE file. No warranty; provided as-is.
