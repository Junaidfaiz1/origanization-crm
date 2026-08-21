---
name: fix-bug
description: Reproduces and fixes one TechNova CRM bug at the service/module layer, then adds a regression test. Use when the user says fix bug, this is broken, error on page, failing test, regression, leak, or reports incorrect bidding, invoices, webhooks, or tenant isolation.
---

# Fix a TechNova CRM bug

Fix **one** reported bug. Do not implement unrelated modules. Do not paper over the failure.

## Instructions

Copy this checklist and complete it in order:

```
Bug: <short name>
- [ ] 1. Reproduce (failing test or exact steps)
- [ ] 2. Isolate root cause
- [ ] 3. Write/adjust a failing regression test
- [ ] 4. Fix at the source (service/module)
- [ ] 5. Confirm test + typecheck + lint
- [ ] 6. Report cause and what changed
- [ ] 7. Update STATUS.md (move to Bugs solved; add regression test path)
```

### 1. Reproduce first

- Failing Vitest, GraphQL error payload (`code`, `message`, `fields`), or exact UI steps.
- If you cannot reproduce, say what you tried. Do not guess-patch.

### 2. Isolate

Check in this order: permission (`requirePermission`), tenant `{ id, organizationId: ctx.organizationId }`, Zod input, Prisma transaction, webhook signature / idempotency, portal field stripping.

Use logs (`requestId`, `operation`, `entityId`) — never log secrets. GraphQL categories: `AuthenticationError`, `AuthorizationError`, `ValidationError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`.

### 3. Failing regression test

Add or adjust a test in `tests/` or `modules/<domain>/*.test.ts` that fails on the bug. If Vitest is unwired, add the minimal config from `.cursor/skills/test-feature/SKILL.md`.

### 4. Fix at the source

Change the service/module (or shared `lib/` helper). UI-only hides are not a fix for server leaks.

Never "fix" by:

- Dropping `requirePermission` or checking `ctx.role === "ADMIN"` only
- Fetching tenant data by id alone
- Empty `catch (e) {}` or `as any`
- Weakening portal stripping so CLIENT sees profit/bids/costs
- Catch-all try/catch that returns success

Critical workflows (lead convert, proposal accept, bid accept, payment apply) stay inside a Prisma transaction.

### 5. Verify

```bash
npx vitest run path/to/regression.test.ts
npm test
npm run typecheck
npm run lint
```

Never leave the repo unbuildable. `npm run build` only when asked or before deploy.

### 6. Report

```
Cause: <one sentence>
Changed: <files / behavior>
Regression: <test path>
Checks: vitest / typecheck / lint
STATUS.md: Bugs solved row added
```

Also update `STATUS.md`: remove from Open bugs, add a Bugs solved row (date, cause, fix, regression test).

## TechNova bug checklist

Match the report to these before closing:

- [ ] **Cross-tenant leak** — org B cannot read/update org A's ids (invoices, bids, leads, …)
- [ ] **CLIENT sees profit/bids** — no bidding internals, freelancer costs, profit, internal notes, negotiations
- [ ] **Double-accepted bid** — still exactly one `awardedBidId`; concurrent accepts → `ConflictError`
- [ ] **Webhook duplicates** — same `providerPaymentId` / event id does not create a second payment
- [ ] **Invoice `amountPaid` > `total`** — rejected unless explicit credit/refund logic exists

FREELANCER must not see others' private bids or agency margin.

## Examples

**User:** `fix: clients can see other orgs' invoices`

Do: reproduce with org B querying org A's invoice id; fail closed (`NotFoundError` or `AuthorizationError`); scope Prisma by `ctx.organizationId`; regression test.

Do not: hide the row in the UI only, or trust client-sent `organizationId`.

**User:** `this is broken` + stack trace

Do: map to error category → service line → failing test → fix. Do not catch-all.
