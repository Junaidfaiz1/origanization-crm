# TechNova CRM

Multi-tenant CRM and bidding SaaS for agencies and software houses. Next.js 16 App Router, GraphQL Yoga 5, Prisma 7, and PostgreSQL.

## Local setup

1. Copy environment variables:

```bash
copy .env.example .env
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Generate the Prisma client, push the schema, and seed demo data:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Run the app:

```bash
npm run dev
```

Demo users all use password `Demo1234!`.

- `owner@technova.test`
- `admin@technova.test`
- `sales@technova.test`
- `pm@technova.test`
- `finance@technova.test`
- `employee@technova.test`
- `freelancer.a@technova.test`
- `client@abcdental.test`

A second tenant (`owner@rival.test` / Rival Studio) exists so cross-organization access can be tested.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
