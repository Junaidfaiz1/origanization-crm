# TechNova CRM — project status

Living tracker: **what is done**, **what remains**, **QA**, and **bugs**.  
Update this file after every feature, test pass, or bugfix. Do not mark a feature Done unless it meets the Definition of Done in `.cursor/rules/feature-workflow.mdc`.

**Last updated:** 2026-08-21 (UI/UX redesign polish pass)

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
| Phase 2 — Auth + multi-tenancy | **Done** (register/login/session/RBAC; invite + role UI; real forgot-password) |
| Phase 3 — CRM | **CRM phase done** — leads, companies, contacts, clients, opportunities, proposals |
| Phase 4 — Projects | **Done** — projects, requirements, team, milestones, tasks, files, activity |
| Phase 5 — Bidding | **Done** — bid requests, submit/withdraw, compare+score, negotiate, accept transaction |
| Phase 6 — Delivery | **Done** — resources, time tracking, expenses, project progress |
| Phase 7 — Finance | Contracts + invoices + **manual payments** done; Stripe deferred |
| Phase 8 — Portals | **Client + freelancer portals done** |
| Phase 9 — Notifications | **Done** — in-app center + event hooks; Resend provider wired (needs `RESEND_API_KEY`) |
| Phase 10 — Reports | **Done** — sales/projects/bidding/finance + live dashboard + Recharts |
| Phase 11 — Polish | **Done** — design system tokens, collapsible shell, role dashboard, opportunities board, invoice document layout, portal chrome |
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
| User invite / role change UI | **Done** | QA pending | `/settings` members table + invite form; GraphQL `workspaceMembers`/`inviteUser`/`updateMemberRole`; last-owner guards; tests in `tests/users-auth.test.ts` |
| Forgot-password email flow | **Done** | QA pending | Tokenized reset + invite accept via `/reset-password`; Resend/console email; hashed `PasswordResetToken.purpose` |
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
| Requirements (CRUD, priority, status, project filter) | **Done** | QA pending | `/requirements` list/detail/new/edit; scoped via parent `project.organizationId`; GraphQL + `PROJECT_VIEW`/`PROJECT_UPDATE`; status summary; seed on ABC project; tests in `tests/requirements.test.ts`. Attachments via Files (`entityType=ProjectRequirement`). |
| Team assignment (assign/remove resource, role) | **Done** | QA pending | `/team` list/detail/new/edit; unique per project+resource; PLANNING/BIDDING → `RESOURCE_ASSIGNED`; rates hidden without `RESOURCE_VIEW`; GraphQL + audit; seed employee on ABC; tests in `tests/team.test.ts` |
| Milestones (CRUD, status, order, billed amounts) | **Done** | QA pending | `/milestones` list/detail/new/edit; scoped via parent `project.organizationId`; GraphQL `milestones`/`milestone` + mutations; uses `PROJECT_VIEW`/`PROJECT_UPDATE`; tests in `tests/milestones.test.ts` |
| Tasks (list + kanban + filters) | **Done** | QA pending | `/tasks` list + `?view=kanban`; detail/new/edit; assignee visibility; closed-project rule; GraphQL + `TASK_*` perms; tests in `tests/tasks.test.ts` |
| Files (R2 + metadata) | **Done** | QA pending | `/files` list/detail/upload; metadata in Postgres; **R2 only** (no local fallback); mime/size validation; signed download URLs; GraphQL list/delete/download URL; tests in `tests/files.test.ts` |
| Project activity | **Done** | QA pending | `/activity` feed + project detail preview; scopes AuditLog to project-related entities; GraphQL `activity`/`projectActivity`; seed sample events; tests in `tests/activity.test.ts` |

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
| Project progress | **Done** | QA pending | `/progress` board + project detail card; milestone/task/hours/budget %; health (on track / at risk / delayed); GraphQL `projectProgress*`; portal shows public progress (no hours/budget burn); tests in `tests/progress.test.ts` |

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
| Resend email service | **Done** | QA pending | `ResendEmailProvider` when `RESEND_API_KEY` set; console fallback otherwise; welcome on register; existing bid/proposal/invoice/payment hooks; HTML escaped; tests in `tests/email.test.ts`. Verify domain/`EMAIL_FROM` in Resend dashboard. |

---

## Phase 10 — Reports

| Feature | Build | QA | Remaining |
| --- | --- | --- | --- |
| Sales / project / bidding / finance reports | **Done** | QA pending | `/reports` tabs; `REPORT_VIEW`; GraphQL overview; tests in `tests/reports.test.ts` |
| Charts (revenue, pipeline, bid conversion) | **Done** | QA pending | Recharts on `/reports`; series via `getReportCharts` + GraphQL `reportCharts`; tests for month bucketing |
| Dashboard revenue & profit live numbers | **Done** | QA pending | `getDashboardMetrics` soft-gates finance + CRM/delivery KPIs; role layout presets |

---

## Phase 11 — Polish

| Item | Build | Notes |
| --- | --- | --- |
| Design system tokens + typography | **Done** | Semantic success/warning/error/info; Geist scale utilities; refined teal brand |
| App shell (sidebar/header/theme) | **Done** | Collapsible sidebar (Zustand persist), theme toggle, avatar menu; permission nav unchanged |
| Role-specific dashboard | **Done** | Soft-gated KPIs by permission; layout presets by roleKey; charts when `REPORT_VIEW` |
| Loading / empty / error | **Done** | Shared `PageSkeleton` table variant; EmptyState icon prop; ErrorState semantic colors |
| DataTable, filters, pagination, sort | **Done** | Denser DataTable; SortSelect + ResultCount on list modules |
| Entity detail chrome | **Done** | `EntityHeader` / `EntityTabs`; project overview metrics; lead + bid + invoice polish |
| Opportunities kanban | **Done** | `?view=kanban` board + list toggle |
| Invoice document layout | **Done** | Print-friendly bill-to / line items / totals |
| Portal chrome | **Done** | Client lighter sidebar treatment; freelancer work portal; theme toggle parity |
| Toasts, confirm dialogs, kanban | **Done** | ConfirmDialog on shared Dialog primitive; tasks + opportunities boards |

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
| `tests/requirements.test.ts` | Closed-project rules, validation, tenant scope, PROJECT perms | No |
| `tests/team.test.ts` | Closed-project rules, RESOURCE_ASSIGNED transition, validation, tenant scope, rate visibility | No |
| `tests/files.test.ts` | Mime/size rules, R2-only provider, validation, PROJECT perms, tenant shape | No |
| `tests/activity.test.ts` | Href map, change summary, filters, PROJECT_VIEW, tenant scope shape | No |
| `tests/polish.test.ts` | Flash toast helpers, shared list-sort + multi-module sort defaults | No |
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
| `tests/email.test.ts` | Provider selection (console vs Resend), HTML escape, invite/reset mail, best-effort errors | No |
| `tests/users-auth.test.ts` | Invite/role rules, last-owner guards, reset validation, USER_* perms, token hash | No |
| `tests/progress.test.ts` | Overall/schedule/health rules, public redaction, PROJECT_VIEW, tenant shape | No |
| `tests/reports.test.ts` | REPORT_VIEW gate, margin formatting, chart bucketing, role perms, tenant shape | No |
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

Suggested next command: **`implement deploy`** / cron / Stripe, or **`what's next?`** (see [`COMMANDS.md`](COMMANDS.md)).

**Note:** Put `RESEND_API_KEY` only in local `.env` (gitignored). Rotate any key shared in chat. File uploads require Cloudflare R2 env vars.
