import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { hasRole } from "@/lib/roles";

const authRoutes = new Set(["/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/public")) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  if (!token) {
    if (authRoutes.has(pathname)) return NextResponse.next();

    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (authRoutes.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/relatorios") && !hasRole(token.role as string | undefined, "GERENTE")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/admin") && !hasRole(token.role as string | undefined, "ADMIN")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
