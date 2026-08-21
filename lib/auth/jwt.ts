import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/config/env";

export const SESSION_COOKIE = "tn_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionPayload = {
  sub: string;
  org: string;
  membershipId: string;
  roleKey: string;
};

function getSecretKey() {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setSubject(payload.sub)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.org !== "string" ||
      typeof payload.membershipId !== "string" ||
      typeof payload.roleKey !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      org: payload.org,
      membershipId: payload.membershipId,
      roleKey: payload.roleKey,
    };
  } catch {
    return null;
  }
}
