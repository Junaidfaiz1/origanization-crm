---
name: next-feature
description: Picks the next TechNova CRM module from the phase order (foundation → auth → CRM → projects → bidding → delivery → finance → portals → notifications → reports → polish → deploy). Use when the user says next feature, continue, what's next, next phase, or asks what to implement after the current module.
---

# Next TechNova CRM feature

## Instructions

1. Inspect the repo: `prisma/schema.prisma`, `modules/`, `app/(dashboard)/`, `app/api/`.
2. Find the **earliest incomplete phase**, then the **earliest incomplete module** in that phase.
3. Tell the user the next module in one sentence and wait — unless they already said `continue` / `next feature` / `implement what's next`.
4. If implementing, follow `.cursor/skills/implement-feature/SKILL.md` for **that module only**.

Phase order (do not skip bidding quality or jump to polish before core workflows):

1. Foundation — Prisma, GraphQL, layout, errors, env
2. Auth — session, org, RBAC, seed users
3. CRM — leads → companies/contacts/clients → opportunities → proposals
4. Projects — project, requirements, team, milestones, tasks, files
5. Bidding — BidRequest, bids, negotiation, comparison, accept transaction
6. Delivery — assignment, time tracking, expenses, progress
7. Finance — contracts, invoices, Stripe webhooks, profit
8. Portals — client + freelancer visibility rules
9. Notifications — in-app + Resend
10. Reports — sales, projects, bidding, finance
11. Polish — empty/loading/error, a11y, responsive
12. Test + deploy — lint, typecheck, test, build, Vercel

When implementing, follow the `implement-feature` skill (do not build extra modules).

## Examples

**User:** `what's next?`  
Repo has auth + leads only → answer: next is Companies/Contacts/Clients (Phase 3). Do not start until they confirm, unless they said continue.

**User:** `next feature` / `continue`  
Implement that single module end-to-end using the implement-feature skill.
