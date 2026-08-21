# TechNova CRM — project status

Living tracker: **what is done**, **what remains**, **QA**, and **bugs**.  
Update this file after every feature, test pass, or bugfix. Do not mark a feature Done unless it meets the Definition of Done in `.cursor/rules/feature-workflow.mdc`.

**Last updated:** 2026-08-20 (Reports shipped)

| Status | Meaning |
| --- | --- |
| Done | Schema + service + GraphQL + UI + authz + tenant scope + tests for critical logic |
| Foundation | Shell, schema, seed, or helper exists; module UI/API not shipped |
| Placeholder | Route exists; “coming soon” / empty module only |
| Not started | Not in the repo as a working feature |
| QA passed | Manually or automatically verified against the checklist below |
| QA pending | Not verified yet |

---

## Summary

| Area | Status |
| --- | --- |
| Phase 1 — Foundation | **Done** (app shell; most module pages still placeholders) |
| Phase 2 — Auth + multi-tenancy | **Done** (register/login/session/RBAC; invite/settings UI incomplete) |
| Phase 3 — CRM | **CRM phase done** — leads, companies, contacts, clients, opportunities, proposals |
| Phase 4 — Projects | **Projects + milestones + tasks done** — requirements/team still placeholder |
| Phase 5 — Bidding | **Done** — bid requests, submit/withdraw, compare+score, negotiate, accept transaction |
| Phase 6 — Delivery | **Done** — resources, time tracking, expenses |
| Phase 7 — Finance | Contracts + invoices + **manual payments** done; Stripe deferred |
| Phase 8 — Portals | **Client + freelancer portals done** |
| Phase 9 — Notifications | **Done** — in-app center + event hooks; email still console stub |
| Phase 10 — Reports | **Done** — sales/projects/bidding/finance + live dashboard |
| Phase 11 — Polish | Partial (layout, empty/error on dashboard) |
| Phase 12 — Test + deploy | Husky + Vitest wired; no Vercel/cron/migrate-on-prod |

**QA of product features:** none yet (no CRM/bidding/finance flows to QA).  
**Bugs solved:** none logged (no production bug reports yet).

---

## Phase 1 — Foundation

| Item | Build | QA | Notes |
| --- | --- | --- | --- |
| Next.js 16 App Router, TypeScript, Tailwind 4 | Done | QA pending | Prisma 7, GraphQL Yoga 5, Apollo Client 4 |
| Prisma schema (all domain models) | Done | QA pending | `prisma/schema.prisma` — models exist; product APIs do not |
| GraphQL Yoga `/api/graphql` | Foundation | QA pending | Domain modules through reports registered |
| Env, errors, logging, monitoring stub | Done | QA pending | `config/env.ts`, `lib/errors`, `lib/logging` |
| Dashboard layout, sidebar, header, theme | Done | QA pending | |
| Reusable UI (button, card, empty, error, money) | Foundation | QA pending | FilterBar + Kanban on tasks |
| Husky pre-commit (lint-staged + typecheck) | Done | QA pending | |
| Cursor rules + implement/test/fix skills | Done | — | `.cursor/rules`, `.cursor/skills` |

---

## Phase 2 — Auth + multi-tenancy

| Item | Build | QA | Notes |
| --- | --- | --- | --- |
| Register (user + org + OWNER membership) | Done | QA pending | Server actions + JWT cookie |
| Login / logout | Done | QA pending | |
| Session + `proxy.ts` dashboard guard | Done | QA pending | Next.js 16 `proxy.ts` (not middleware) |
| Roles + permissions seed | Done | QA pending | `config/permissions.ts` + Prisma seed |
| Tenant isolation helpers | Foundation | QA pending | `lib/tenant`, unit tests — **not** proven on CRM queries yet |
| GraphQL `me` | Done | QA pending | |
| User invite / role change UI | Not started | — | Settings page is a placeholder |
| Forgot-password email flow | Placeholder | — | Page exists; no real reset mail |
| Cross-tenant access test (two orgs) | Foundation | QA pending | Seed has Rival Studio (`owner@rival.test`); no e2e |

**Demo logins (after seed):** password `Demo1234!`  
`owner@technova.test`, `admin@technova.test`, `sales@technova.test`, `pm@technova.test`, `finance@technova.test`, `employee@technova.test`, `freelancer.a@technova.test`, `client@abcdental.test`, `owner@rival.test`

---

## Phase 3 — CRM

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Leads (CRUD, assign, status, convert transaction) | **Done** | QA pending | `/leads` list/detail/new/edit; GraphQL `leads`/`lead` + mutations; convert creates Company+Contact+Client+Opportunity; archive is soft-delete; tests in `tests/leads.test.ts` |
| Companies (CRUD, archive) | **Done** | QA pending | `/companies` list/detail/new/edit; GraphQL `companies`/`company` + mutations; soft archive; tests in `tests/companies.test.ts` |
| Contacts (CRUD, archive, company link) | **Done** | QA pending | `/contacts` list/detail/new/edit; filter by company; GraphQL `contacts`/`contact` + mutations; archive blocked for primary client contacts; tests in `tests/contacts.test.ts` |
| Clients (CRUD, status, archive) | **Done** | QA pending | `/clients` list/detail/new/edit; filter by status + company; GraphQL `clients`/`client` + mutations; tests in `tests/clients.test.ts` |
| Opportunities + pipeline UI | **Done** | QA pending | `/opportunities` list/detail/new/edit; pipeline summary (value, weighted, win rate, stage columns); GraphQL + `opportunityPipelineSummary`; tests in `tests/opportunities.test.ts` |
| Proposals (items, send, accept/reject) | **Done** | QA pending | `/proposals` list/detail/new/edit; line items + totals; send/accept/reject/archive actions; accept creates Project transaction and marks opportunity WON; tests in `tests/proposals.test.ts` |

---

## Phase 4 — Projects

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Projects (CRUD, status, manager, archive, status summary) | **Done** | QA pending | `/projects` list/detail/new/edit; GraphQL `projects`/`project` + mutations; links from clients/opportunities/proposals; tests in `tests/projects.test.ts` |
| Requirements | Placeholder | — | |
| Team assignment | Placeholder | — | |
| Milestones (CRUD, status, order, billed amounts) | **Done** | QA pending | `/milestones` list/detail/new/edit; scoped via parent `project.organizationId`; GraphQL `milestones`/`milestone` + mutations; uses `PROJECT_VIEW`/`PROJECT_UPDATE`; tests in `tests/milestones.test.ts` |
| Tasks (list + kanban + filters) | **Done** | QA pending | `/tasks` list + `?view=kanban`; detail/new/edit; assignee visibility; closed-project rule; GraphQL + `TASK_*` perms; tests in `tests/tasks.test.ts` |
| Files (R2 + metadata) | Not started | — | Storage stub throws if used |
| Project activity | Foundation | — | Dashboard shows recent `AuditLog` only |

---

## Phase 5 — Bidding (core differentiator)

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| BidRequest open/close/pause/cancel | **Done** | QA pending | CRUD + status transitions; GraphQL + `/bidding` |
| Bid submit / withdraw | **Done** | QA pending | Freelancer submit/update/withdraw; one active bid per bidder |
| Comparison + scoring UI | **Done** | QA pending | Price/experience/rating/delivery weights; no auto-lowest |
| Shortlist / negotiate / counter | **Done** | QA pending | Append-only negotiation history; original amount preserved |
| Accept transaction (one winner, reject others) | **Done** | QA pending | Locks request, awards bid, rejects others, assigns resource, project `RESOURCE_ASSIGNED` |
| Concurrent accept | Foundation | QA pending | Optimistic `awardedBidId` null lock; no multi-client DB stress test |
| `/bidding`, `/bidding/requests/[id]`, `/bidding/my-bids` | **Done** | QA pending | Plus new/edit request routes; freelancers see own bids only |

---

## Phase 6 — Delivery

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Resources + skills | **Done** | QA pending | `/resources` list/detail/new/edit; skills, rates, availability; GraphQL + `RESOURCE_*` perms; tests in `tests/resources.test.ts` |
| Time tracking (server-validated duration) | **Done** | QA pending | `/time-tracking` list/detail/new/edit; timer start/stop; server-computed duration; GraphQL + `TIME_ENTRY_*` perms; tests in `tests/time-tracking.test.ts` |
| Expenses approve/reject | **Done** | QA pending | `/expenses` list/detail/new/edit; submit, approve/reject; GraphQL + `EXPENSE_*` perms; tests in `tests/expenses.test.ts` |
| Project progress | Not started | — | |

---

## Phase 7 — Finance

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Contracts | **Done** | QA pending | `/contracts` list/detail/new/edit; status workflow DRAFT→SENT→SIGNED→ACTIVE→COMPLETED; GraphQL + `CONTRACT_*` perms; seed on ABC project; tests in `tests/contracts.test.ts` |
| Invoices + items + unique numbers | **Done** | QA pending | `/invoices` list/detail/new/edit; line items + totals; org-unique numbers via sequence; send/cancel/overdue; GraphQL + `INVOICE_*` perms; tests in `tests/invoices.test.ts` |
| Payments + Stripe webhook + idempotency | **Done (manual)** | QA pending | Manual record/void only — no Stripe. `/payments` + invoice balance updates; `PAYMENT_*` perms; tests in `tests/payments.test.ts`. Stripe deferred. |
| Profit formula | **Done** | QA pending | `lib/finance/profit.ts` + finance report / dashboard live numbers |
| Amount paid cannot exceed total | Foundation | — | Calc helper; not wired to mutations |

---

## Phase 8 — Portals

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Client portal (no bids/profit/internal notes) | **Done** | QA pending | `/portal` home + proposals/projects/invoices/payments; CLIENT redirect from dashboard; accept/reject proposals; scoped by linked contact→client; no bidding/expenses/contracts/costs; tests in `tests/client-portal.test.ts` |
| Freelancer portal (own bids/tasks only) | **Done** | QA pending | `/freelancer` home + open requests/bids/tasks/time/profile; FREELANCER redirect from dashboard; submit/withdraw/negotiate own bids; own tasks + timer; resource pay info; no competing bids/margin; tests in `tests/freelancer-portal.test.ts` |

---

## Phase 9 — Notifications + email

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| In-app notification center | **Done** | QA pending | `/notifications` + portal/freelancer inboxes; header unread badge; GraphQL list/mark read; own-inbox only |
| Read / unread | **Done** | QA pending | Mark one / mark all; unread filter |
| Event hooks (bid/proposal/task/invoice/payment) | **Done** | QA pending | createNotifications in domain txns; email templates fired best-effort |
| Resend email service | Foundation | — | Console no-op if no API key; templates wired from domain events |

---

## Phase 10 — Reports

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Sales / project / bidding / finance reports | **Done** | QA pending | `/reports` tabs; `REPORT_VIEW`; GraphQL overview; tests in `tests/reports.test.ts` |
| Charts (revenue, pipeline, bid conversion) | Foundation | — | Tabular metrics shipped; chart library not added |
| Dashboard revenue & profit live numbers | **Done** | QA pending | Via `getDashboardMetrics`; gated by `REPORT_VIEW` |

---

## Phase 11 — Polish

| Item | Build | Notes |
| --- | --- | --- |
| Loading / empty / error on dashboard | Foundation | Module pages are placeholders, not full states |
| DataTable, filters, pagination, sort | Not started | |
| Toasts, confirm dialogs, kanban | Not started | |
| Mobile / a11y pass | Foundation | Phone/tablet/desktop shell: drawer nav, compact header, auth brand bar, safe-area, 44px targets |

---

## Phase 12 — Test + deploy

| Item | Build | Notes |
| --- | --- | --- |
| `npm run typecheck` / `lint` / `test` | Wired | Unit tests for helpers only |
| Prisma migrate on Neon/prod | Not started | Local/dev may use `db:push` |
| Vercel + cron (`expire-bids`, overdue invoices, reminders) | Not started | No `/api/cron/*` |
| E2E: lead → bid accept → invoice → payment | Not started | |

---

## Automated tests (not product QA)

These prove **helpers**, not full features:

| Test file | Covers | Product QA? |
| --- | --- | --- |
| `tests/profit.test.ts` | Profit / margin / divide-by-zero | No |
| `tests/leads.test.ts` | Convert-twice, archived, tenant scope, CLIENT cannot LEAD_VIEW | No |
| `tests/companies.test.ts` | Archive rules, validation, tenant scope, CLIENT/FREELANCER lack COMPANY_VIEW | No |
| `tests/contacts.test.ts` | Archive rules (incl. primary client), validation, tenant scope, COMPANY perms | No |
| `tests/clients.test.ts` | Archive rules, validation, tenant scope, CLIENT_VIEW for CRM roles | No |
| `tests/opportunities.test.ts` | Archive rules, validation, probability, pipeline stages, OPPORTUNITY_VIEW | No |
| `tests/proposals.test.ts` | Totals, status rules, validation, tenant scope, portal permissions | No |
| `tests/projects.test.ts` | Archive/edit rules, closed-task rule, validation, tenant scope, role perms | No |
| `tests/milestones.test.ts` | Closed-project rules, delete-with-tasks, validation, PROJECT perms | No |
| `tests/tasks.test.ts` | Closed-project rules, milestone validation, list filters, TASK perms | No |
| `tests/resources.test.ts` | Delete rules, validation, RESOURCE perms, tenant scope | No |
| `tests/time-tracking.test.ts` | Duration rules, closed-project rule, validation, TIME_ENTRY perms | No |
| `tests/expenses.test.ts` | Review rules, validation, EXPENSE perms, tenant scope | No |
| `tests/contracts.test.ts` | Status transitions, validation, CONTRACT perms, tenant scope | No |
| `tests/lead-validation.test.ts` | Create schema + list filters | No |
| `tests/bid-rules.test.ts` | Submit/accept/reject/open/close/negotiate rules, scoring, validation, authz | No |
| `tests/invoice-calculations.test.ts` | Totals, amount due | No |
| `tests/invoices.test.ts` | Send/cancel/edit rules, validation, INVOICE perms, tenant scope | No |
| `tests/payments.test.ts` | Record/void rules, overpay guard, PAYMENT perms, tenant scope | No |
| `tests/client-portal.test.ts` | CLIENT-only access, linked profile, field isolation, portal perms | No |
| `tests/freelancer-portal.test.ts` | FREELANCER-only access, home routing, field isolation, portal perms | No |
| `tests/notifications.test.ts` | Ownership, type map, audience hrefs, unread filter, tenant shape | No |
| `tests/reports.test.ts` | REPORT_VIEW gate, margin formatting, role perms, tenant shape | No |
| `tests/tenant.test.ts` | Tenant where-clause helper | No |
| `tests/permissions.test.ts` | Role permission maps | No |

---

## QA log

Record a row when a human or agent **verifies** a feature (not merely that the page exists).

| Date | Feature | Result | How | Notes |
| --- | --- | --- | --- | --- |
| — | — | — | — | No feature QA yet |

**QA checklist (copy per feature):**

- [ ] Happy path works
- [ ] Permission denied without the right key
- [ ] Org B cannot open Org A’s record by id
- [ ] Loading / empty / error / success
- [ ] Audit log written for money/status/permission changes
- [ ] CLIENT cannot see bidding, costs, or profit
- [ ] FREELANCER cannot see others’ private bids or agency margin

---

## Bugs solved

| Date | Bug | Root cause | Fix | Regression test |
| --- | --- | --- | --- | --- |
| — | — | — | — | None yet |

---

## Open bugs

| Opened | Bug | Severity | Status |
| --- | --- | --- | --- |
| — | — | — | None logged |

---

## How to update this file

Copy-paste chat phrases and the full command list: [`COMMANDS.md`](COMMANDS.md).

After `implement <feature>`: set Build to Done only if DoD is met; otherwise Foundation/Placeholder. Add remaining work in the same row.

After `add tests for <feature>`: mention the test file under Automated tests; do not mark QA passed unless a real flow was checked.

After `fix: <bug>`: move a row from Open bugs → Bugs solved (date, cause, fix, test path).

Suggested next command: **`implement polish`** or **`what's next?`** (see [`COMMANDS.md`](COMMANDS.md)).
