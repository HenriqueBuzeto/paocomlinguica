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

  const userPermissions = (token.permissions as string[]) || [];

  if (pathname.startsWith("/relatorios") && !userPermissions.includes("reports.view_financial")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/configuracoes") && !userPermissions.includes("settings.manage")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
