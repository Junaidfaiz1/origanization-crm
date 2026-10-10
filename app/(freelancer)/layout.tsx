import { requireFreelancerUser } from "@/lib/auth/page";
import { FreelancerHeader } from "@/components/freelancer/freelancer-header";
import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { logoutAction } from "@/modules/auth/actions";
import { getFreelancerProfile } from "@/modules/freelancer-portal/service";

export const dynamic = "force-dynamic";

export default async function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireFreelancerUser();
  const profile = await getFreelancerProfile(ctx);

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          title="Resource profile not linked"
          description="Your login is not linked to a freelancer resource. Ask the agency to connect your user to a resource profile."
        />
        <form action={logoutAction} className="mt-6 flex justify-center">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <AppApolloProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        <FreelancerHeader
          userName={ctx.user.name}
          organizationName={ctx.user.organization.name}
        />
        <main className="mx-auto w-full max-w-[1264px] flex-1 px-3 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </AppApolloProvider>
  );
}
