"use client";

import { FREELANCER_NAV } from "@/components/freelancer/freelancer-nav";
import { FreelancerSidebarNav } from "@/components/freelancer/freelancer-sidebar";
import { PortalTopNav } from "@/components/layout/portal-top-nav";

const NOTIFICATIONS_HREF = "/freelancer/notifications";

const LINKS = FREELANCER_NAV.filter((item) => item.href !== NOTIFICATIONS_HREF).map(
  ({ href, label }) => ({ href, label }),
);

export function FreelancerHeader({
  userName,
  organizationName,
}: {
  userName: string;
  organizationName: string;
}) {
  return (
    <PortalTopNav
      portalLabel="Freelancer portal"
      organizationName={organizationName}
      accountSubtitle="Freelancer"
      userName={userName}
      homeHref="/freelancer"
      notificationsHref={NOTIFICATIONS_HREF}
      links={LINKS}
      renderMobileNav={(onNavigate) => <FreelancerSidebarNav onNavigate={onNavigate} />}
    />
  );
}
