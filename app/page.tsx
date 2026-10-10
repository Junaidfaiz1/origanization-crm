import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { homePathForRole } from "@/lib/auth/home";
import { redirect } from "next/navigation";
import { MarketingHome } from "@/components/marketing/home";
import { HOME_METADATA } from "@/lib/marketing/seo";

export const metadata = HOME_METADATA;

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    const user = await getAuthenticatedUser(session.sub, session.org);
    redirect(homePathForRole(user?.roleKey));
  }

  return <MarketingHome />;
}
