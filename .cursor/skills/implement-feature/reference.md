# TechNova module spec (implement only the requested slice)

Statuses and fields below are canonical. Use these enums in Prisma + GraphQL.

## Lifecycle

Lead → Client → Opportunity → Proposal → Won → Project → BidRequest → Bid → Contract → Milestones → Tasks → Invoice → Payment → Profit → Complete

## Auth entities (Phase 2)

- **Organization:** name, slug (unique), logo, email, phone, website, timezone, currency
- **User:** name, email, passwordHash, avatar, phone, status
- **OrganizationMember:** organizationId + userId unique, roleId, status, joinedAt
- **Role:** organizationId nullable for system roles; name, description
- **Permission** + **RolePermission**

Roles: OWNER, ADMIN, SALES_MANAGER, PROJECT_MANAGER, FINANCE_MANAGER, EMPLOYEE, FREELANCER, CLIENT

## Leads

Fields: organizationId, name, email, phone, companyName, source, estimatedValue, status, assignedToId, notes

Statuses: NEW, CONTACTED, QUALIFIED, UNQUALIFIED, CONVERTED, LOST

Convert is a **transaction**; may create Company, Contact, Client, Opportunity. Do not convert twice.

## Company / Contact / Client

- Company: name, website, industry, address, city, country
- Contact: companyId, name, email, phone, designation
- Client: companyId, primaryContactId, status, notes

A company has many contacts.

## Opportunities

Fields: clientId, name, description, estimatedValue, probability, expectedCloseDate, stage, assignedToId

Stages: NEW, DISCOVERY, REQUIREMENTS, PROPOSAL, NEGOTIATION, WON, LOST

Pipeline UI: pipeline value, weighted value, count, win rate, expected revenue.

## Proposals

Proposal: opportunityId, clientId, title, description, subtotal, discount, tax, total, currency, validUntil, status, createdById, sentAt, acceptedAt, rejectedAt

Statuses: DRAFT, SENT, VIEWED, CHANGES_REQUESTED, ACCEPTED, REJECTED, EXPIRED

ProposalItem: description, quantity, unitPrice, total

Client: view, accept, reject, request changes. Accept may create a project (transaction).

## Projects

Fields: clientId, opportunityId?, proposalId?, name, description, budget, estimatedCost, actualCost, startDate, endDate, status, managerId

Statuses: PLANNING, BIDDING, RESOURCE_ASSIGNED, IN_PROGRESS, IN_REVIEW, COMPLETED, CANCELLED, CLOSED

Tabs: Overview, Requirements, Bidding, Team, Milestones, Tasks, Files, Expenses, Invoices, Activity

ProjectRequirement: title, description, priority, status, file relation

## Resources

Resource: userId, type (EMPLOYEE | FREELANCER), hourlyRate, experienceYears, bio, availabilityStatus, rating

ResourceSkill ↔ Skill (skill.organizationId nullable for globals)

## Bidding (differentiator — not columns on Project)

**BidRequest:** projectId, title, description, budgetMin/Max, currency, deadline, biddingType (INTERNAL | EXTERNAL), status, startsAt, endsAt, createdById, awardedBidId?

Statuses: DRAFT, OPEN, PAUSED, CLOSED, AWARDED, CANCELLED

**Bid:** bidRequestId, bidderId, amount (>0), estimatedDays (>0), proposal, status, submittedAt

Statuses: DRAFT, SUBMITTED, SHORTLISTED, NEGOTIATION, ACCEPTED, REJECTED, WITHDRAWN

Rules: one active bid per bidder per request; no bids on closed requests; rejected cannot be accepted; one winner.

**BidNegotiation:** bidId, senderId, amount, estimatedDays, message, status (OFFER, COUNTER_OFFER, ACCEPTED, REJECTED, WITHDRAWN). Never overwrite original bid amount.

Comparison UI (managers): freelancer, rating, experience, skills, amount, delivery, hourly rate, previous projects, proposal, negotiation status. Actions: shortlist, negotiate, reject, accept. Do **not** auto-select lowest. Optional visible scoring (price 40%, experience 20%, rating 20%, delivery 20%).

**Accept transaction:** verify open + no winner → accept bid → reject other active bids → BidRequest AWARDED → assign resource → project RESOURCE_ASSIGNED → audit + notifications → optional contract draft. Rollback on failure. Unique constraint on winner.

Routes: `/bidding`, `/bidding/requests`, `/bidding/requests/[id]`, `/bidding/my-bids`, `/bidding/my-bids/[id]`

## Contracts / milestones / tasks / time

- Contract: projectId, clientId, resourceId?, bidId?, title, content, totalAmount, currency, dates, status (DRAFT, SENT, SIGNED, ACTIVE, COMPLETED, CANCELLED). MVP: create + status; no e-sign required.
- Milestone: projectId, name, description, amount, dueDate, status (PENDING, IN_PROGRESS, IN_REVIEW, COMPLETED, BLOCKED), order
- Task: projectId, milestoneId?, assignedToId, title, description, priority (LOW, MEDIUM, HIGH, URGENT), status (TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE), dueDate, estimatedHours, actualHours. List + Kanban + filters.
- TimeEntry: projectId, taskId, userId, startedAt, endedAt, durationSeconds (server-computed), hourlyRate, billable, notes. Do not trust client duration.

Completed/closed projects: no new normal tasks without reopen.

## Finance

Profit: `revenue - resourceCost - expenses - paymentFees`. Margin = profit/revenue*100; revenue 0 → display `—`.

**Expense:** projectId, category, description, amount, currency, date, submittedBy, status (PENDING, APPROVED, REJECTED), receiptFileId?

**Invoice:** clientId, projectId, invoiceNumber (unique per org), subtotal, discount, tax, total, amountPaid, amountDue, currency, issueDate, dueDate, status (DRAFT, SENT, PARTIALLY_PAID, PAID, OVERDUE, CANCELLED), notes + InvoiceItem lines

**Payment:** invoiceId, amount, currency, provider, providerPaymentId (unique), status (PENDING, SUCCEEDED, FAILED, REFUNDED), paidAt, metadata

Stripe: test mode, `/api/stripe/webhook`, verify signature on **raw** body, idempotent. Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed, charge.refunded. Never mark paid from the frontend only. amountPaid cannot exceed total unless credit/refund is explicit.

## Files / notifications / email / audit

- File metadata in Postgres; bytes in R2. StorageService: upload, delete, getSignedUrl, exists. Validate mime + size.
- Notification: userId, type, title, message, entityType, entityId, readAt. Events: bid lifecycle, project/task assigned, invoice/payment, proposal accept/reject.
- EmailService abstraction (Resend behind it): welcome, proposal, bid notify/accept/reject, invoice, receipt, reminder.
- AuditLog: action, entityType, entityId, oldValue, newValue, metadata. No passwords, tokens, secrets, payment credentials.

## Dashboard / reports / cron / seed

Dashboard cards: revenue, profit, active projects, open bids, pending proposals, outstanding invoices. Charts: revenue/profit over time, pipeline, project status, bid conversion, expenses. Respect permissions.

Reports: sales (leads, conversion, pipeline, won/lost), projects (active/completed/delayed/profit), bidding (requests, conversion, averages), finance (revenue, expenses, profit, outstanding, payments). `REPORT_VIEW`.

Cron (secret header, idempotent): `/api/cron/expire-bids`, `expire-proposals`, `mark-overdue-invoices`, `send-reminders`.

Seed org “TechNova Agency”, all eight roles, realistic ABC Dental Clinic / Dental Management Platform ($8,000) with three bids ($7k/55d, $6.5k/70d, $7.5k/50d), milestones, tasks, invoice, payment. No real PII.

## Permissions

LEAD_*, CLIENT_*, OPPORTUNITY_*, PROPOSAL_* (incl SEND/ACCEPT/REJECT), PROJECT_*, BID_REQUEST_* (incl OPEN/CLOSE), BID_* (VIEW/SUBMIT/UPDATE/SHORTLIST/ACCEPT/REJECT), CONTRACT_*, TASK_*, INVOICE_* (incl SEND), PAYMENT_VIEW, EXPENSE_*, REPORT_VIEW, AUDIT_LOG_VIEW, USER_*, ORGANIZATION_*.
