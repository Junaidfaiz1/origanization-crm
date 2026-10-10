import { requirePortalUser } from "@/lib/auth/page";
import { resolvePortalClientId } from "@/modules/client-portal/service";
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
      <div className="flex min-h-dvh flex-col bg-background">
        <PortalHeader
          userName={ctx.user.name}
          organizationName={ctx.user.organization.name}
          companyName={client.company.name}
        />
        <main className="mx-auto w-full max-w-[1264px] flex-1 px-3 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </AppApolloProvider>
  );
}
