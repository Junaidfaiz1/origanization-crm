import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { ContractForm } from "@/components/contracts/contract-form";
import {
  getContract,
  listContractBidOptions,
  listContractProjectOptions,
  listContractResourceOptions,
} from "@/modules/contracts/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit contract" };

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "CONTRACT_CREATE")) {
    return (
      <ErrorState
        title="You cannot edit contracts"
        description="Ask a project manager to grant CONTRACT_CREATE."
      />
    );
  }

  const { id } = await params;

  let contract;
  try {
    contract = await getContract(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this contract"
        description="Check the database connection and try again."
      />
    );
  }

  if (!["DRAFT", "SENT"].includes(contract.status)) {
    return (
      <ErrorState
        title="This contract cannot be edited"
        description="Only draft or sent contracts can be updated."
      />
    );
  }

  const [projects, resources, bids] = await Promise.all([
    listContractProjectOptions(ctx),
    listContractResourceOptions(ctx),
    listContractBidOptions(ctx, contract.projectId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/contracts/${contract.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {contract.title}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Edit contract</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contract details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm contract={contract} projects={projects} resources={resources} bids={bids} />
        </CardContent>
      </Card>
    </div>
  );
}
