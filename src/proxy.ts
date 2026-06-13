import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Next 16 renames Middleware to "Proxy". This is the edge-runtime instance,
// built from the edge-safe authConfig only (no Prisma/bcrypt here).
//
// These are OPTIMISTIC guards (per the Next docs): coarse role gating + login
// redirects. Authoritative checks still run server-side in each route/action.
const { auth } = NextAuth(authConfig);

const STAFF = ["cashier", "inventory_manager", "accountant", "hr", "admin"];
const POS = ["cashier", "admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const session = req.auth;
  const role = session?.user?.role;

  const isAdmin = path.startsWith("/admin");
  const isPos = path.startsWith("/pos");
  const isAccount = path.startsWith("/account");

  if (!isAdmin && !isPos && !isAccount) return NextResponse.next();

  // Not signed in → bounce to login, remembering where they were going.
  if (!session) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }

  const denied = () => NextResponse.redirect(new URL("/forbidden", nextUrl));

  if (isAdmin && !STAFF.includes(role ?? "")) return denied();
  if (isPos && !POS.includes(role ?? "")) return denied();
  // /account is fine for any authenticated user.

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*", "/account/:path*"],
};
