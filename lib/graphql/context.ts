import { prisma } from "@/lib/prisma/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { logger } from "@/lib/logging/logger";

export type GraphQLContext = {
  requestId: string;
  userId?: string;
  organizationId?: string;
  membershipId?: string;
  roleKey?: string;
  permissions: string[];
  prisma: typeof prisma;
};

function createRequestId() {
  return crypto.randomUUID();
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) {
    return null;
  }

  const parts = header.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

export async function createContext(request: Request): Promise<GraphQLContext> {
  const requestId =
    request.headers.get("x-request-id") ?? createRequestId();
  const token = readCookie(request, SESSION_COOKIE);
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return {
      requestId,
      permissions: [],
      prisma,
    };
  }

  const user = await getAuthenticatedUser(session.sub, session.org);
  if (!user) {
    logger.warn("Session present but membership missing", {
      requestId,
      userId: session.sub,
      organizationId: session.org,
      operation: "graphql.context",
    });
    return {
      requestId,
      permissions: [],
      prisma,
    };
  }

  return {
    requestId,
    userId: user.id,
    organizationId: user.organization.id,
    membershipId: session.membershipId,
    roleKey: user.roleKey,
    permissions: user.permissions,
    prisma,
  };
}
