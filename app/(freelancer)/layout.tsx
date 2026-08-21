import { requireFreelancerUser } from "@/lib/auth/page";
import {
  FreelancerBrand,
  FreelancerSidebarNav,
} from "@/components/freelancer/freelancer-sidebar";
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
      <div className="flex min-h-dvh bg-background">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
          <FreelancerBrand />
          <FreelancerSidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <FreelancerHeader
            userName={ctx.user.name}
            organizationName={ctx.user.organization.name}
          />
          <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </AppApolloProvider>
  );
}
