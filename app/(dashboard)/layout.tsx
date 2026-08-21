import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AppApolloProvider } from "@/components/providers/apollo-provider";
import { FlashToast } from "@/components/shared/flash-toast";
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>
      <div className="flex min-h-dvh bg-background">
        <Sidebar
          permissions={user.permissions}
          userName={user.name}
          organizationName={user.organization.name}
          roleName={user.roleName}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            userName={user.name}
            organizationName={user.organization.name}
            roleName={user.roleName}
            permissions={user.permissions}
            unreadNotificationCount={unreadNotificationCount}
          />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 px-3 py-4 outline-none sm:px-4 sm:py-6 lg:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <Suspense fallback={null}>
              <FlashToast />
            </Suspense>
            {children}
          </main>
        </div>
      </div>
    </AppApolloProvider>
  );
}
