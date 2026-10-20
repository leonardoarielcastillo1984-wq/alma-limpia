import { NextRequest, NextResponse } from "next/server";

// Protección ligera a nivel cookie. La verificación real de sesión/rol
// ocurre en server components y route handlers (getCurrentUser/requireAdmin).
const PROTECTED_PREFIXES = ["/admin", "/mi-universo", "/mensajes"];
const AUTH_PAGES = ["/login", "/registro"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has("alma_session");

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (needsAuth && !hasSession) {
    const url = new URL("/", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.some((p) => pathname.startsWith(p)) && hasSession) {
    return NextResponse.redirect(new URL("/inicio", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mi-universo/:path*", "/mensajes/:path*", "/login", "/registro"],
};
