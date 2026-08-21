---
name: test-feature
description: Writes Vitest tests for one TechNova CRM module covering happy path, authz, tenant isolation, and business-rule failures. Use when the user says test, add tests, write tests, cover bidding, test invoices, unit tests, or asks for test coverage for a domain.
---

# Test a TechNova CRM feature

Write tests for **one** named module. Do not implement that module (use `implement-feature`). Do not dump a whole-app suite.

## Instructions

Copy this checklist and complete it in order:

```
Tests: <module>
- [ ] 0. Wire Vitest if missing
- [ ] 1. Identify the module and service
- [ ] 2. List critical paths
- [ ] 3. Write tests (happy + authz + tenant + rule failures)
- [ ] 4. Run Vitest; fix test bugs (not product rules)
- [ ] 5. Typecheck + lint if you touched app code
```

### 0. Wire Vitest if missing

If `vitest.config.mts` or `"test": "vitest run"` is absent, add a **minimal** node-env config:

- Include: `tests/**/*.test.ts`, `modules/**/*.test.ts`, `lib/**/*.test.ts`
- Resolve `@/` via Vite `resolve.tsconfigPaths` (or `vite-tsconfig-paths` if needed)
- Do not add Playwright, coverage dashboards, or hundreds of tests

Then: `npm test`.

### 1. Identify the module

Map the user phrase to one domain under `modules/<domain>/` (or `lib/` for shared helpers). Read `service.ts`, `validation.ts`, and `.cursor/rules/testing.mdc`.

If the module does not exist yet, stop and say so — do not scaffold the feature.

### 2. List critical paths

Cover **happy path**, **authz denial**, **cross-tenant**, and **business-rule failures**. When the domain exists, include the matching rows from the testing rule:

- Authz, tenant isolation (never fetch by id alone)
- Lead convert, proposal accept
- Bid submit / negotiate / accept, **concurrent accept**
- Invoice calc, `amountPaid` cannot exceed `total`
- Stripe webhook **idempotency** (`providerPaymentId` / event id)
- Profit: `revenue - resourceCost - expenses - paymentFees`; revenue 0 → no divide-by-zero

Skip rows for modules that are not in the repo.

### 3. Write the tests

Prefer `tests/<domain>.test.ts` or colocated `modules/<domain>/*.test.ts`.

```ts
import { describe, expect, it } from "vitest";

it("does not let org B read org A's invoice", async () => {
  await expect(getInvoice(ctxB, { id: invoiceA.id })).rejects.toThrow(NotFoundError);
});
```

- Call the **real service**. Mock Stripe, R2, Resend only.
- Do **not** `vi.mock` the function under test or mock Prisma so `organizationId` / transactions disappear.
- Concurrent bid accept: `Promise.allSettled` two accepts → still **one** `awardedBidId`.
- Webhook: same event twice → one payment row.
- No `any`. Assert typed errors (`AuthorizationError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`).

If an assertion fails because the **implementation** violates the spec, do not weaken the test. Report it and wait unless the user also asked to fix the bug.

### 4. Run

```bash
npx vitest run tests/<domain>.test.ts
npm test
```

Fix broken tests (imports, fixtures). Do not delete coverage to go green.

### 5. Checks

If you changed production code: `npm run typecheck` and `npm run lint`. `npm run build` only when asked or for Phase 12.

List new test files in `STATUS.md` under Automated tests. Do not mark the feature QA passed unless a real flow was verified.

## Examples

**User:** `add tests for bidding`

Do: bid submit on closed request, duplicate active bid, negotiate keeps original amount, accept one winner + reject others, concurrent accept, tenant + `BID_ACCEPT` authz.

Do not: implement bidding, Stripe, or Playwright.

**User:** `write tests for invoices`

Do: totals/tax/discount math, unique number per org, `amountPaid` cannot exceed `total`, tenant isolation.

Do not: full payment webhook suite unless they named payments.
