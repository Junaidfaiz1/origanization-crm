# Implementation phase order

Do not skip ahead to polish or deploy while earlier phases are missing. Implement **one module per command** inside the current phase.

| Phase | Name | Ship |
| --- | --- | --- |
| 1 | Foundation | Next.js, Tailwind, shadcn, Prisma, GraphQL Yoga, env, errors, logging, shell layout, auth foundation |
| 2 | Auth | Register/login/logout, session, org + membership, roles, permissions, tenant isolation, seed users |
| 3 | CRM | Leads, companies, contacts, clients, opportunities, pipeline, proposals (Lead → Proposal) |
| 4 | Projects | Project, requirements, team, milestones, tasks, files, activity (proposal accept → project) |
| 5 | Bidding | BidRequest, bids, comparison, shortlist, negotiation, accept/reject, award, audit, concurrency tests |
| 6 | Delivery | Resource assignment, tasks/milestones (if not done), time tracking, expenses, progress |
| 7 | Finance | Contracts, invoices, payments, Stripe webhook, expenses, profit |
| 8 | Portals | Client portal + freelancer portal with field-level visibility |
| 9 | Notifications | In-app center, read/unread, Resend templates |
| 10 | Reports | Sales, project, bidding, finance, profitability dashboard |
| 11 | Polish | Empty/skeleton/error/toast/confirm, a11y, responsive, filters/search/sort consistency |
| 12 | Test + deploy | lint, typecheck, test, build, migrations, seed, Vercel |

After each module: typecheck + lint. After each phase: tests + build if practical. Keep the repo green.

If the user says “continue” or “next feature”, pick the earliest incomplete module in this table (see next-feature skill).
