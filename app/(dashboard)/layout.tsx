import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { getUnreadNotificationCount } from "@/modules/notifications/service";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await getAuthenticatedUser(session.sub, session.org);
  if (!user) {
    redirect("/login");
  }

  if (user.roleKey === "CLIENT") {
    redirect("/portal");
  }
  if (user.roleKey === "FREELANCER") {
    redirect("/freelancer");
  }

  const unreadNotificationCount = await getUnreadNotificationCount({
    userId: user.id,
    organizationId: user.organization.id,
    roleKey: user.roleKey,
    permissions: user.permissions,
  });

  return (
    <AppApolloProvider>
      <div className="flex min-h-dvh bg-background">
        <Sidebar permissions={user.permissions} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            userName={user.name}
            organizationName={user.organization.name}
            roleName={user.roleName}
            permissions={user.permissions}
            unreadNotificationCount={unreadNotificationCount}
          />
          <main className="flex-1 px-3 py-4 sm:px-4 sm:py-6 lg:px-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {children}
          </main>
        </div>
      </div>
    </AppApolloProvider>
  );
}
