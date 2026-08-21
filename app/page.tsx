import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { homePathForRole } from "@/lib/auth/home";

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await getAuthenticatedUser(session.sub, session.org);
  redirect(homePathForRole(user?.roleKey));
}
