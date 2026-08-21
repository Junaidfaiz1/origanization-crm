import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/jwt";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthRoute = PUBLIC_PATHS.has(pathname);
  const isPortal = pathname.startsWith("/portal");
  const isFreelancer = pathname.startsWith("/freelancer");
  const isProtected =
    isPortal ||
    isFreelancer ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/companies") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/opportunities") ||
    pathname.startsWith("/proposals") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/bidding") ||
    pathname.startsWith("/resources") ||
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/time-tracking") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/milestones");

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session) {
    const home =
      session.roleKey === "CLIENT"
        ? "/portal"
        : session.roleKey === "FREELANCER"
          ? "/freelancer"
          : "/dashboard";
    return NextResponse.redirect(new URL(home, request.url));
  }

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
