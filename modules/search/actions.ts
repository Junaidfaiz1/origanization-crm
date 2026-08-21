"use server";

import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import {
  searchWorkspace,
  type SearchHit,
} from "@/modules/search/service";

export type { SearchHit };

export async function searchWorkspaceAction(query: string): Promise<SearchHit[]> {
  const session = await getSession();
  if (!session) {
    return [];
  }

  const user = await getAuthenticatedUser(session.sub, session.org);
  if (!user) {
    return [];
  }

  return searchWorkspace(
    {
      userId: user.id,
      organizationId: user.organization.id,
      permissions: user.permissions,
    },
    query,
  );
}
