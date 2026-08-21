# Cursor chat commands — TechNova CRM

**Roman Urdu:** Ek command = ek module. Poora CRM ek chat mein mat banana. Copy-paste the English phrases below into Cursor chat. Agent English follow karega; aap mix mein baat kar sakte ho.

This file is the copy-paste list for **feature-by-feature** work. Agents follow `.cursor/rules/` and the skills below. Do not dump the whole product in one pass.

---

## How it works

| You type | Agent does |
| --- | --- |
| One named command | **One module** end-to-end (schema → service → GraphQL → UI → tests → checks) |
| `what's next?` | Names the next module only — **does not build** |
| `next feature` / `continue` | Builds the next **incomplete** module from `STATUS.md` |
| Several modules in one message | Still ships **one** slice and lists the rest — do not ask for “build everything” |

Progress lives in [`STATUS.md`](STATUS.md). After each command the agent updates that file. A placeholder page is **not** Done.

---

## Skills (what the agent loads)

| Phrase | Skill |
| --- | --- |
| `implement …` / `add module` / `build feature` | `.cursor/skills/implement-feature/SKILL.md` |
| `what's next?` / `next feature` / `continue` | `.cursor/skills/next-feature/SKILL.md` |
| `add tests` / `write tests` / `test …` | `.cursor/skills/test-feature/SKILL.md` |
| `fix:` / `this is broken` | `.cursor/skills/fix-bug/SKILL.md` |

Definition of Done: `.cursor/rules/feature-workflow.mdc`.

---

## Start / next

Copy one line:

| Paste this | What happens |
| --- | --- |
| `what's next?` | Tell the next module from `STATUS.md`. **Do not implement.** |
| `next feature` | Implement the next incomplete module (currently **polish** / deploy prep). |
| `continue` | Same as `next feature`. |
| `implement leads` | Implement that named module only (example). |

**Right now (2026-08-20):** Reports shipped. Suggested next:

```
what's next?
```

Or polish / deploy:

```
implement polish
```

---

## Implement (recommended order)

Paste **one** command per chat. Wait until typecheck, lint, and tests pass and `STATUS.md` is updated before the next command.

### Already shipped — do not re-run

| Command | Phase | Status |
| --- | --- | --- |
| `implement foundation` | 1 | **Done** — app shell, Prisma, GraphQL Yoga, layout |
| `implement auth` | 2 | **Done** — register/login/session/RBAC |
| `implement leads` | 3 | **Done** — CRUD, convert transaction, GraphQL, `/leads` |
| `implement companies` | 3 | **Done** — CRUD, archive, GraphQL, `/companies` |
| `implement contacts` | 3 | **Done** — CRUD, archive, company link, GraphQL, `/contacts` |
| `implement clients` | 3 | **Done** — CRUD, status, archive, GraphQL, `/clients` |
| `implement opportunities` | 3 | **Done** — CRUD, pipeline summary, GraphQL, `/opportunities` |
| `implement proposals` | 3 | **Done** — line items, send/accept/reject, GraphQL, `/proposals` |
| `implement projects` | 4 | **Done** — CRUD, status summary, manager, archive, GraphQL, `/projects` |
| `implement milestones` | 4 | **Done** — CRUD, status, order, billed amounts, GraphQL, `/milestones` |
| `implement bidding` | 5 | **Done** — requests, compare/score, negotiate, accept txn, my-bids |
| `implement tasks` | 4 | **Done** — list + kanban, filters, assignee visibility, GraphQL, `/tasks` |
| `implement resources` | 6 | **Done** — profiles, skills, rates, availability, GraphQL, `/resources` |
| `implement time tracking` | 6 | **Done** — log time, timer, server duration, GraphQL, `/time-tracking` |
| `implement expenses` | 6/7 | **Done** — submit, approve/reject, GraphQL, `/expenses` |
| `implement contracts` | 7 | **Done** — create, status workflow, GraphQL, `/contracts` |
| `implement invoices` | 7 | **Done** — line items, unique numbers, send/cancel, GraphQL, `/invoices` |
| `implement payments` | 7 | **Done** — manual record/void, invoice balance sync, GraphQL, `/payments` (no Stripe) |
| `implement client portal` | 8 | **Done** — `/portal` proposals/projects/invoices/payments; no bidding/costs |
| `implement freelancer portal` | 8 | **Done** — `/freelancer` requests/bids/tasks/time/profile; own bids only |
| `implement notifications` | 9 | **Done** — in-app inbox, read/unread, event hooks, GraphQL |
| `implement reports` | 10 | **Done** — sales/projects/bidding/finance reports + live dashboard |

Invite/settings UI and forgot-password mail are still incomplete; do not use these commands to rebuild auth from scratch. Use a named follow-up later (e.g. `implement user invite`) if needed.

### Phase 4 — Projects (tasks done)

Already shipped — see table above. Do not re-run `implement tasks`.

### Phase 5 — Bidding (done)

Already shipped — see table above. Do not re-run `implement bidding`.

### Phase 6 — Delivery (done)

Already shipped — see table above. Do not re-run delivery modules unless fixing regressions.

### Phase 7 — Finance

Contracts, invoices, and **manual payments** are done (Stripe not in scope). Continue with notifications or ask `what's next?`.

### Phase 8 — Portals

Client and freelancer portals are done.

### Phase 9 — Notifications

Notifications are done.

### Phase 10 — Reports

Reports are done. Continue with polish or ask `what's next?`:

```
what's next?
```

### Phase 11 — Polish

```
implement polish
```

Same pattern for any other domain: `implement <module>` (e.g. `implement files` after projects).

---

## Tests

Use after the module exists. Tests-only — does **not** implement the feature.

```
add tests for bidding
```

```
write tests for invoices
```

```
test lead conversion
```

Also valid: `add tests for <module>`, `write tests for <module>`, `test <workflow>`.

---

## Bugs

One bug per command. Paste the error or steps after the line.

```
fix: clients can see other orgs' invoices
```

```
this is broken
```

Then paste the stack trace, GraphQL payload, or exact UI steps.

Also valid: `fix: <short description>`, `fix bug: <description>`.

---

## Recommended order (Phase 3 → 12)

Do not jump to polish, reports, or deploy while earlier workflows are missing. **Do not skip bidding.**

| Phase | Modules (one command each) |
| --- | --- |
| 1 Foundation | Shipped |
| 2 Auth | Shipped |
| **3 CRM** | leads → companies → contacts → clients → opportunities → proposals |
| **4 Projects** | projects → milestones → tasks (files if needed) |
| **5 Bidding** | bidding (BidRequest, bids, negotiation, accept transaction) |
| **6 Delivery** | resources → time tracking → expenses |
| **7 Finance** | contracts → invoices → payments |
| **8 Portals** | client portal → freelancer portal |
| **9 Notifications** | notifications |
| **10 Reports** | reports |
| **11 Polish** | empty/loading/error, a11y, responsive — after core workflows |
| **12 Test + deploy** | lint, typecheck, test, build, Vercel — last |

---

## Rules

1. **One command at a time.** Do not paste a list of `implement …` lines in one message if you want them all built now — the agent still ships one module.
2. **Wait for green.** After implement/test/fix: `npm run typecheck`, `npm run lint`, and `npm test` must pass before the next command.
3. **`STATUS.md` must update.** Build status, remaining work, tests, or bugs-solved row.
4. **Page-only is not Done.** Need Prisma + service + Zod + authz + GraphQL + UI (list/detail, filters, pagination) + loading/empty/error + audit + critical tests.
5. **No whole-CRM dump.** Never “implement the rest” / “build all phases”.
6. **Tenant + permissions on the server.** UI hiding is not enough.

When the current module is Done, the agent should **offer** the next command (see `STATUS.md` → Suggested next command) and **stop**.
