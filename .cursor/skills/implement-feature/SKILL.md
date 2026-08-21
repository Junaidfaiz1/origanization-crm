---
name: implement-feature
description: Implements one TechNova CRM module end-to-end (Prisma, GraphQL, service, authz, UI, tests, lint). Use when the user says implement, add module, build feature, or names a domain such as leads, clients, bidding, invoices, proposals, projects, payments, or portals.
---

# Implement a TechNova CRM feature

Implement **one** module to portfolio quality. Do not generate unrelated modules. Do not dump the whole app.

Read [reference.md](reference.md) for fields, statuses, and workflows. Read [phase-order.md](phase-order.md) if the user asked for a phase rather than a named module.

## Instructions

Copy this checklist and complete it in order:

```
Feature: <name>
- [ ] 0. Inspect existing patterns
- [ ] 1. Identify spec slice
- [ ] 2. Prisma schema + migration
- [ ] 3. Service + Zod + authz
- [ ] 4. GraphQL schema + resolvers
- [ ] 5. UI pages + reused components
- [ ] 6. Tests for critical logic
- [ ] 7. Typecheck + lint (fix before stop)
- [ ] 8. Update STATUS.md (build status, remaining, QA still pending unless verified)
```

### 0. Inspect existing module patterns first

Before writing files, open:

- `modules/` — copy the layout of an existing domain (`validation.ts`, `service.ts`, `schema.ts`, `resolvers.ts`)
- `prisma/schema.prisma` — enums, `organizationId`, index style
- `lib/graphql` — how modules are merged
- `lib/permissions`, `lib/auth`, `lib/audit`, `lib/errors`
- `components/` — `DataTable`, `EmptyState`, `ErrorState`, `StatusBadge`, `MoneyDisplay`, `ConfirmDialog`
- `app/(dashboard)/` — route group, loading.tsx, sidebar links

If this is the first domain module, create that layout and register it. Match names already in the repo; do not invent a second pattern.

### 1. Identify the feature from the spec

Map the user phrase to **one** domain in [reference.md](reference.md). If they named a phase (“implement CRM”), still ship **one vertical slice** (e.g. Leads) and list remaining phase modules — do not build the entire phase unless they listed every module.

Out of scope for this command: other phases, seed polish, unrelated settings.

### 2. Implement in this order

1. **Schema** — Prisma models, enums, FKs, `organizationId`, composite indexes, unique constraints (invoice numbers per org, one awarded bid). Migration.
2. **Service / validation / authz** — Zod inputs; `requirePermission`; all queries `{ id, organizationId: ctx.organizationId }`; transactions for convert/accept/pay.
3. **GraphQL** — SDL + resolvers that only call the service; connection pagination; strip fields the actor must not see.
4. **UI** — dashboard (or portal) routes; loading/empty/error/success; filters; pagination; toasts; confirm dialogs.
5. **Tests** — follow `.cursor/skills/test-feature/SKILL.md` (tenant isolation + critical workflow). Do not skip.
6. **Checks** — `npm run typecheck`, `npm run lint`, and `npm test`. Fix before stopping.
7. **STATUS.md** — set this module to Done only if DoD is met; otherwise Foundation/Placeholder. Keep QA pending until a real flow is verified.

### 3. Tenant isolation checklist

- [ ] `organizationId` on the model (if org-owned)
- [ ] `ctx.organizationId` from session; ignore client `organizationId`
- [ ] `findFirst` / `updateMany` scoped by `{ id, organizationId }`
- [ ] Lists filtered by tenant + permission
- [ ] No Prisma in React components
- [ ] Cross-tenant test: org B cannot read org A’s id

### 4. Portal visibility (client vs freelancer vs internal)

| Actor | This feature may expose | Must hide |
| --- | --- | --- |
| Internal staff | Full module if permission allows | Other tenants; finance without `REPORT_VIEW` / invoice perms |
| CLIENT | Own proposals, projects, milestones, invoices, payments, files | Bidding, freelancer costs, profit, internal notes, negotiations |
| FREELANCER | Eligible bid requests, **own** bids, assigned tasks, own time, own pay info | Other private bids, agency margin, client-internal notes |

If the screen is internal-only, do not add it to portal nav.

### 5. Reuse existing components

Use `DataTable`, `SearchInput`, `FilterBar`, `Pagination`, `StatusBadge`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `FormField`, `MoneyDisplay`, `DateDisplay`, `UserSelect` before creating new primitives. Domain badges (`BidStatusBadge`) live in `components/` and are reused.

### 6. Professional B2B SaaS UX, not tutorial CRUD

- Sidebar entry in the correct group (CRM / Delivery / Finance / Settings)
- Page title, breadcrumbs, primary action, filters
- Status badges and money formatting — never raw enums or unformatted cents
- Empty copy that tells the user what to do next
- Destructive actions confirmed; success via toast
- Responsive; Server Components by default

### 7. Do not implement unrelated modules

Do not scaffold placeholders for later phases. You may add a **nullable FK** or enum value required by this feature’s workflow (e.g. lead conversion creating a Client) — implement the minimum so the transaction is real, not a fake TODO.

## Examples

**User:** `implement leads`

Do: Lead model, statuses, assign, notes, convert transaction, GraphQL, `/leads` UI, audit, tests, typecheck/lint.

Do not: full opportunity pipeline, bidding, invoices.

**User:** `implement bidding`

Do: BidRequest, Bid, BidNegotiation, comparison UI, accept transaction, notifications/audit hooks, concurrency test.

Do not: Stripe, client portal, reports.

**User:** `implement invoices`

Do: Invoice + items, unique numbers per org, send, totals, `/invoices` UI.

Do not: full Stripe webhook unless needed for amountPaid; stub payment as a follow-up if Phase 7 payments are not in scope of the command.
