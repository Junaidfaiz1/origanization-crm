import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SYSTEM_ROLES,
} from "../config/permissions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const DEMO_PASSWORD = "Demo1234!";

async function seedPermissionsAndRoles() {
  for (const key of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: key.replaceAll("_", " ").toLowerCase() },
      create: {
        key,
        description: key.replaceAll("_", " ").toLowerCase(),
      },
    });
  }

  const permissions = await prisma.permission.findMany();
  const permissionByKey = new Map(permissions.map((item) => [item.key, item]));

  for (const key of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { key },
      update: {
        name: key,
        isSystem: true,
        description: `${key.replaceAll("_", " ").toLowerCase()} system role`,
      },
      create: {
        key,
        name: key,
        isSystem: true,
        description: `${key.replaceAll("_", " ").toLowerCase()} system role`,
      },
    });

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const rolePermissions = ROLE_PERMISSIONS[key];
    await prisma.rolePermission.createMany({
      data: rolePermissions
        .map((permissionKey) => permissionByKey.get(permissionKey)?.id)
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
    });
  }
}

async function getRoleId(key: string) {
  const role = await prisma.role.findFirst({
    where: { key, isSystem: true },
  });
  if (!role) {
    throw new Error(`Missing system role ${key}`);
  }
  return role.id;
}

async function main() {
  await seedPermissionsAndRoles();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const technova = await prisma.organization.upsert({
    where: { slug: "technova-agency" },
    update: {},
    create: {
      name: "TechNova Agency",
      slug: "technova-agency",
      email: "hello@technova.test",
      website: "https://technova.test",
      timezone: "UTC",
      currency: "USD",
    },
  });

  const rival = await prisma.organization.upsert({
    where: { slug: "rival-studio" },
    update: {},
    create: {
      name: "Rival Studio",
      slug: "rival-studio",
      email: "ops@rival.test",
      timezone: "UTC",
      currency: "USD",
    },
  });

  const users = [
    { email: "owner@technova.test", name: "Nina Ortiz", role: "OWNER" },
    { email: "admin@technova.test", name: "Aisha Khan", role: "ADMIN" },
    { email: "sales@technova.test", name: "Marcus Lee", role: "SALES_MANAGER" },
    { email: "pm@technova.test", name: "Priya Raman", role: "PROJECT_MANAGER" },
    { email: "finance@technova.test", name: "Owen Blake", role: "FINANCE_MANAGER" },
    { email: "employee@technova.test", name: "Sofia Patel", role: "EMPLOYEE" },
    { email: "freelancer.a@technova.test", name: "Daniel Cole", role: "FREELANCER" },
    { email: "freelancer.b@technova.test", name: "Elena Voss", role: "FREELANCER" },
    { email: "freelancer.c@technova.test", name: "Jamal Wright", role: "FREELANCER" },
    { email: "client@abcdental.test", name: "Dr. Hannah Brooks", role: "CLIENT" },
  ] as const;

  const createdUsers: Record<string, string> = {};
  for (const item of users) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { name: item.name, passwordHash, status: "ACTIVE" },
      create: {
        email: item.email,
        name: item.name,
        passwordHash,
        status: "ACTIVE",
      },
    });
    createdUsers[item.email] = user.id;
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: technova.id,
          userId: user.id,
        },
      },
      update: { roleId: await getRoleId(item.role), status: "ACTIVE" },
      create: {
        organizationId: technova.id,
        userId: user.id,
        roleId: await getRoleId(item.role),
        status: "ACTIVE",
      },
    });
  }

  const rivalOwner = await prisma.user.upsert({
    where: { email: "owner@rival.test" },
    update: { passwordHash, status: "ACTIVE" },
    create: {
      email: "owner@rival.test",
      name: "Rival Owner",
      passwordHash,
      status: "ACTIVE",
    },
  });
  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: rival.id,
        userId: rivalOwner.id,
      },
    },
    update: {},
    create: {
      organizationId: rival.id,
      userId: rivalOwner.id,
      roleId: await getRoleId("OWNER"),
      status: "ACTIVE",
    },
  });

  const skillNames = ["React", "Node.js", "PostgreSQL", "UI/UX", "QA"];
  const skills = [];
  for (const name of skillNames) {
    skills.push(
      await prisma.skill.upsert({
        where: {
          organizationId_name: { organizationId: technova.id, name },
        },
        update: {},
        create: { organizationId: technova.id, name },
      }),
    );
  }

  const resourceSpecs = [
    {
      email: "employee@technova.test",
      type: "EMPLOYEE" as const,
      rate: 55,
      years: 5,
      rating: 4.5,
    },
    {
      email: "freelancer.a@technova.test",
      type: "FREELANCER" as const,
      rate: 70,
      years: 6,
      rating: 4.6,
    },
    {
      email: "freelancer.b@technova.test",
      type: "FREELANCER" as const,
      rate: 60,
      years: 5,
      rating: 4.2,
    },
    {
      email: "freelancer.c@technova.test",
      type: "FREELANCER" as const,
      rate: 80,
      years: 8,
      rating: 4.8,
    },
  ];

  const resources = [];
  for (const spec of resourceSpecs) {
    const resource = await prisma.resource.upsert({
      where: {
        organizationId_userId: {
          organizationId: technova.id,
          userId: createdUsers[spec.email],
        },
      },
      update: {
        hourlyRate: spec.rate,
        experienceYears: spec.years,
        rating: spec.rating,
      },
      create: {
        organizationId: technova.id,
        userId: createdUsers[spec.email],
        type: spec.type,
        hourlyRate: spec.rate,
        experienceYears: spec.years,
        rating: spec.rating,
        bio: `${spec.type === "EMPLOYEE" ? "In-house" : "Independent"} engineer.`,
        availabilityStatus: "AVAILABLE",
      },
    });
    resources.push(resource);
    await prisma.resourceSkill.deleteMany({ where: { resourceId: resource.id } });
    await prisma.resourceSkill.createMany({
      data: skills.slice(0, 3).map((skill) => ({
        resourceId: resource.id,
        skillId: skill.id,
      })),
    });
  }

  const company = await prisma.company.upsert({
    where: { id: "seed-abc-dental-company" },
    update: {},
    create: {
      id: "seed-abc-dental-company",
      organizationId: technova.id,
      name: "ABC Dental Clinic",
      industry: "Healthcare",
      website: "https://abcdental.test",
      city: "Austin",
      country: "US",
    },
  });

  const contact = await prisma.contact.upsert({
    where: { id: "seed-abc-dental-contact" },
    update: {},
    create: {
      id: "seed-abc-dental-contact",
      organizationId: technova.id,
      companyId: company.id,
      userId: createdUsers["client@abcdental.test"],
      name: "Dr. Hannah Brooks",
      email: "client@abcdental.test",
      designation: "Clinic Director",
    },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-abc-dental-client" },
    update: {},
    create: {
      id: "seed-abc-dental-client",
      organizationId: technova.id,
      companyId: company.id,
      primaryContactId: contact.id,
      status: "ACTIVE",
      notes: "Priority healthcare account.",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-abc-lead" },
    update: {},
    create: {
      id: "seed-abc-lead",
      organizationId: technova.id,
      name: "Dr. Hannah Brooks",
      email: "client@abcdental.test",
      companyName: "ABC Dental Clinic",
      source: "Referral",
      estimatedValue: 8000,
      status: "CONVERTED",
      assignedToId: createdUsers["sales@technova.test"],
      convertedClientId: client.id,
      notes: "Interested in a clinic operations platform.",
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-riverside-lead" },
    update: {},
    create: {
      id: "seed-riverside-lead",
      organizationId: technova.id,
      name: "Priya Nair",
      email: "priya.nair@riverside.test",
      companyName: "Riverside Wellness",
      source: "Website",
      estimatedValue: 4200,
      status: "QUALIFIED",
      assignedToId: createdUsers["sales@technova.test"],
      notes: "Asked for a patient portal demo next week.",
    },
  });

  await prisma.company.upsert({
    where: { id: "seed-riverside-company" },
    update: {},
    create: {
      id: "seed-riverside-company",
      organizationId: technova.id,
      name: "Riverside Wellness",
      industry: "Healthcare",
      website: "https://riverside.test",
      city: "Portland",
      country: "US",
    },
  });

  await prisma.contact.upsert({
    where: { id: "seed-riverside-contact" },
    update: {},
    create: {
      id: "seed-riverside-contact",
      organizationId: technova.id,
      companyId: "seed-riverside-company",
      name: "Priya Nair",
      email: "priya.nair@riverside.test",
      designation: "Operations Lead",
      phone: "+1 503 555 0199",
    },
  });

  await prisma.client.upsert({
    where: { id: "seed-riverside-client" },
    update: {},
    create: {
      id: "seed-riverside-client",
      organizationId: technova.id,
      companyId: "seed-riverside-company",
      primaryContactId: "seed-riverside-contact",
      status: "ACTIVE",
      notes: "Qualified lead — demo scheduled.",
    },
  });

  await prisma.opportunity.upsert({
    where: { id: "seed-riverside-opportunity" },
    update: {},
    create: {
      id: "seed-riverside-opportunity",
      organizationId: technova.id,
      clientId: "seed-riverside-client",
      name: "Patient Portal MVP",
      description: "Self-scheduling and intake for wellness patients.",
      estimatedValue: 4200,
      probability: 40,
      stage: "DISCOVERY",
      assignedToId: createdUsers["sales@technova.test"],
    },
  });

  const opportunity = await prisma.opportunity.upsert({
    where: { id: "seed-abc-opportunity" },
    update: {},
    create: {
      id: "seed-abc-opportunity",
      organizationId: technova.id,
      clientId: client.id,
      name: "Dental Management Platform",
      description: "Replace spreadsheets with a clinic management system.",
      estimatedValue: 8000,
      probability: 80,
      stage: "PROPOSAL",
      assignedToId: createdUsers["sales@technova.test"],
    },
  });

  const proposal = await prisma.proposal.upsert({
    where: { id: "seed-abc-proposal" },
    update: {},
    create: {
      id: "seed-abc-proposal",
      organizationId: technova.id,
      opportunityId: opportunity.id,
      clientId: client.id,
      title: "ABC Dental — Platform Build",
      description: "Design, build, and launch a dental operations platform.",
      subtotal: 8000,
      total: 8000,
      currency: "USD",
      status: "ACCEPTED",
      createdById: createdUsers["sales@technova.test"],
      sentAt: new Date(),
      acceptedAt: new Date(),
    },
  });

  if ((await prisma.proposalItem.count({ where: { proposalId: proposal.id } })) === 0) {
    await prisma.proposalItem.create({
      data: {
        proposalId: proposal.id,
        description: "Dental Management Platform",
        quantity: 1,
        unitPrice: 8000,
        total: 8000,
      },
    });
  }

  const project = await prisma.project.upsert({
    where: { id: "seed-abc-project" },
    update: {},
    create: {
      id: "seed-abc-project",
      organizationId: technova.id,
      clientId: client.id,
      opportunityId: opportunity.id,
      proposalId: proposal.id,
      name: "Dental Management Platform",
      description: "Multi-module clinic platform covering appointments, charts, and billing.",
      budget: 8000,
      estimatedCost: 6500,
      status: "BIDDING",
      managerId: createdUsers["pm@technova.test"],
    },
  });

  const bidRequest = await prisma.bidRequest.upsert({
    where: { id: "seed-abc-bid-request" },
    update: {},
    create: {
      id: "seed-abc-bid-request",
      organizationId: technova.id,
      projectId: project.id,
      title: "Full-stack build for ABC Dental",
      description: "Need a senior full-stack engineer for a 50-70 day delivery window.",
      budgetMin: 6000,
      budgetMax: 8000,
      currency: "USD",
      biddingType: "EXTERNAL",
      status: "OPEN",
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdById: createdUsers["pm@technova.test"],
    },
  });

  const bidData = [
    {
      id: "seed-bid-a",
      email: "freelancer.a@technova.test",
      amount: 7000,
      days: 55,
      proposal: "React + Node delivery with weekly demos.",
    },
    {
      id: "seed-bid-b",
      email: "freelancer.b@technova.test",
      amount: 6500,
      days: 70,
      proposal: "Lower cost, longer timeline, strong backend focus.",
    },
    {
      id: "seed-bid-c",
      email: "freelancer.c@technova.test",
      amount: 7500,
      days: 50,
      proposal: "Fastest delivery with senior architecture support.",
    },
  ];

  for (const bid of bidData) {
    await prisma.bid.upsert({
      where: { id: bid.id },
      update: {},
      create: {
        id: bid.id,
        organizationId: technova.id,
        bidRequestId: bidRequest.id,
        bidderId: createdUsers[bid.email],
        resourceId: resources.find((item) => item.userId === createdUsers[bid.email])?.id,
        amount: bid.amount,
        estimatedDays: bid.days,
        proposal: bid.proposal,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  }

  await prisma.bidNegotiation.createMany({
    data: [
      {
        bidId: "seed-bid-a",
        senderId: createdUsers["pm@technova.test"],
        amount: 6500,
        estimatedDays: 55,
        message: "Can you come closer to $6,500?",
        status: "COUNTER_OFFER",
      },
      {
        bidId: "seed-bid-a",
        senderId: createdUsers["freelancer.a@technova.test"],
        amount: 6800,
        estimatedDays: 55,
        message: "I can do $6,800 while keeping the 55-day plan.",
        status: "COUNTER_OFFER",
      },
    ],
    skipDuplicates: true,
  });

  const freelancerAResource = resources.find(
    (item) => item.userId === createdUsers["freelancer.a@technova.test"],
  );

  await prisma.contract.upsert({
    where: { id: "seed-abc-contract" },
    update: {},
    create: {
      id: "seed-abc-contract",
      organizationId: technova.id,
      projectId: project.id,
      clientId: client.id,
      resourceId: freelancerAResource?.id,
      bidId: "seed-bid-a",
      title: "ABC Dental — Full-stack development agreement",
      content:
        "Scope: design, build, and launch the dental management platform.\nPayment: milestone-based per project plan.\nTerm: 55 days from contract activation.",
      totalAmount: 6800,
      currency: "USD",
      startDate: new Date(),
      endDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
      status: "DRAFT",
    },
  });

  const milestones = [
    { id: "seed-ms-1", name: "UI/UX", order: 1, amount: 1200 },
    { id: "seed-ms-2", name: "Frontend", order: 2, amount: 2200 },
    { id: "seed-ms-3", name: "Backend", order: 3, amount: 2200 },
    { id: "seed-ms-4", name: "Testing", order: 4, amount: 1200 },
    { id: "seed-ms-5", name: "Deployment", order: 5, amount: 1200 },
  ];

  for (const milestone of milestones) {
    await prisma.milestone.upsert({
      where: { id: milestone.id },
      update: {},
      create: {
        id: milestone.id,
        projectId: project.id,
        name: milestone.name,
        amount: milestone.amount,
        status: "PENDING",
        order: milestone.order,
        dueDate: new Date(Date.now() + milestone.order * 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.task.upsert({
    where: { id: "seed-task-wireframes" },
    update: {},
    create: {
      id: "seed-task-wireframes",
      organizationId: technova.id,
      projectId: project.id,
      milestoneId: "seed-ms-1",
      assignedToId: createdUsers["employee@technova.test"],
      title: "Clinic dashboard wireframes",
      priority: "HIGH",
      status: "TODO",
      estimatedHours: 16,
    },
  });

  const wireframeStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const wireframeEnd = new Date(wireframeStart.getTime() + 2 * 3600 * 1000);
  await prisma.timeEntry.upsert({
    where: { id: "seed-time-wireframes" },
    update: {
      durationSeconds: 7200,
    },
    create: {
      id: "seed-time-wireframes",
      organizationId: technova.id,
      projectId: project.id,
      taskId: "seed-task-wireframes",
      userId: createdUsers["employee@technova.test"],
      startedAt: wireframeStart,
      endedAt: wireframeEnd,
      durationSeconds: 7200,
      hourlyRate: 55,
      billable: true,
      notes: "Initial wireframe exploration",
    },
  });

  await prisma.invoice.upsert({
    where: {
      organizationId_invoiceNumber: {
        organizationId: technova.id,
        invoiceNumber: "INV-0001",
      },
    },
    update: {},
    create: {
      organizationId: technova.id,
      clientId: client.id,
      projectId: project.id,
      invoiceNumber: "INV-0001",
      subtotal: 1200,
      total: 1200,
      amountPaid: 1200,
      amountDue: 0,
      currency: "USD",
      status: "PAID",
      issueDate: new Date(),
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      notes: "Milestone 1 — UI/UX discovery",
    },
  });

  const invoice = await prisma.invoice.findFirst({
    where: { organizationId: technova.id, invoiceNumber: "INV-0001" },
  });

  if (invoice && (await prisma.invoiceItem.count({ where: { invoiceId: invoice.id } })) === 0) {
    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: "UI/UX milestone",
        quantity: 1,
        unitPrice: 1200,
        total: 1200,
      },
    });
  }

  if (invoice) {
    await prisma.payment.createMany({
      data: [
        {
          organizationId: technova.id,
          invoiceId: invoice.id,
          amount: 1200,
          currency: "USD",
          provider: "MANUAL",
          providerPaymentId: "BANK-SEED-001",
          status: "SUCCEEDED",
          paidAt: new Date(),
          metadata: {
            method: "BANK_TRANSFER",
            notes: "Milestone 1 bank transfer",
          },
        },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.invoice.upsert({
    where: {
      organizationId_invoiceNumber: {
        organizationId: technova.id,
        invoiceNumber: "INV-0002",
      },
    },
    update: {
      status: "SENT",
      amountDue: 2200,
      amountPaid: 0,
    },
    create: {
      organizationId: technova.id,
      clientId: client.id,
      projectId: project.id,
      invoiceNumber: "INV-0002",
      subtotal: 2200,
      total: 2200,
      amountPaid: 0,
      amountDue: 2200,
      currency: "USD",
      status: "SENT",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: "Milestone 2 — Frontend delivery",
      items: {
        create: [
          {
            description: "Frontend milestone",
            quantity: 1,
            unitPrice: 2200,
            total: 2200,
          },
        ],
      },
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        organizationId: technova.id,
        projectId: project.id,
        category: "Software",
        description: "Design system kit",
        amount: 89,
        currency: "USD",
        date: new Date(),
        submittedById: createdUsers["pm@technova.test"],
        status: "APPROVED",
      },
      {
        organizationId: technova.id,
        projectId: project.id,
        category: "Travel",
        description: "Client discovery workshop travel",
        amount: 240,
        currency: "USD",
        date: new Date(),
        submittedById: createdUsers["employee@technova.test"],
        status: "PENDING",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.notification.createMany({
    data: [
      {
        organizationId: technova.id,
        userId: createdUsers["pm@technova.test"],
        type: "NEW_BID",
        title: "New bid submitted",
        message: "Daniel Cole submitted a $7,000 bid.",
        entityType: "Bid",
        entityId: "seed-bid-a",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.create({
    data: {
      organizationId: technova.id,
      userId: createdUsers["pm@technova.test"],
      action: "Opened bid request",
      entityType: "BidRequest",
      entityId: bidRequest.id,
    },
  });

  await prisma.invoiceSequence.upsert({
    where: { organizationId: technova.id },
    update: { lastNumber: 2 },
    create: { organizationId: technova.id, lastNumber: 2 },
  });

  console.log("Seed complete. Demo password for all users: Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
