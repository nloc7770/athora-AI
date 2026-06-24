import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/", "/login", "/register"]);
const AUTH_ROUTES = new Set(["/login", "/register"]);
const TOKEN_NAME = "athora-token";

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get(TOKEN_NAME)?.value ??
    request.headers.get(TOKEN_NAME) ??
    null;

  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  // Authenticated user on login/register → redirect to dashboard
  if (token && isAuthRoute) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Unauthenticated user on protected route → redirect to login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets (images, svgs, etc.)
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$|api/).*)",
  ],
};
