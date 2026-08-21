<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TechNova CRM

Multi-tenant CRM + bidding SaaS for agencies. Implement **one feature at a time**.

- Rules: `.cursor/rules/` (workflow, stack, architecture, business rules, errors, performance, UI, GraphQL/Prisma, auth, tests, bug-fixing)
- When the user says implement / add module / build feature: `.cursor/skills/implement-feature/SKILL.md`
- When the user says next feature / continue / what's next: `.cursor/skills/next-feature/SKILL.md`
- When the user says test X / add tests / write tests: `.cursor/skills/test-feature/SKILL.md`
- When the user says fix bug / this is broken / failing test: `.cursor/skills/fix-bug/SKILL.md`

Chat commands (copy-paste): [`COMMANDS.md`](COMMANDS.md). Progress tracker: `STATUS.md` (done / remaining / QA / bugs). Update it after each feature, test pass, or bugfix.

Do not generate the entire product in one pass. Definition of Done is in the feature-workflow rule.
