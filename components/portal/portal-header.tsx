"use client";

import { PORTAL_NAV } from "@/components/portal/portal-nav";
import { PortalSidebarNav } from "@/components/portal/portal-sidebar";
import { PortalTopNav } from "@/components/layout/portal-top-nav";

const NOTIFICATIONS_HREF = "/portal/notifications";

const LINKS = PORTAL_NAV.filter((item) => item.href !== NOTIFICATIONS_HREF).map(
  ({ href, label }) => ({ href, label }),
);

export function PortalHeader({
  userName,
  organizationName,
  companyName,
}: {
  userName: string;
  organizationName: string;
  companyName: string;
}) {
  return (
    <PortalTopNav
      portalLabel="Client portal"
      organizationName={organizationName}
      accountSubtitle={companyName}
      userName={userName}
      homeHref="/portal"
      notificationsHref={NOTIFICATIONS_HREF}
      links={LINKS}
      renderMobileNav={(onNavigate) => <PortalSidebarNav onNavigate={onNavigate} />}
    />
  );
}
