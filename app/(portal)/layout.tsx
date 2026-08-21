import { requirePortalUser } from "@/lib/auth/page";
import { resolvePortalClientId } from "@/modules/client-portal/service";
import { PortalBrand, PortalSidebarNav } from "@/components/portal/portal-sidebar";
import { PortalHeader } from "@/components/portal/portal-header";
import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { ErrorState } from "@/components/shared/error-state";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requirePortalUser();
  const client = await resolvePortalClientId(ctx);

  if (!client) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          title="Portal not linked"
          description="Your login is not linked to a client profile. Ask the agency to connect your contact."
        />
      </div>
    );
  }

  return (
    <AppApolloProvider>
      <div className="flex min-h-dvh bg-background">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
          <PortalBrand />
          <PortalSidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalHeader
            userName={ctx.user.name}
            organizationName={ctx.user.organization.name}
            companyName={client.company.name}
          />
          <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </AppApolloProvider>
  );
}
