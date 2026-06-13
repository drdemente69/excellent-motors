import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

// Edge-safe Auth.js config shared by the Node instance (auth.ts) and the
// Proxy/edge instance (proxy.ts). Must NOT import Prisma, bcrypt, or anything
// Node-only — the Proxy runtime is the Edge runtime.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // the Credentials provider is added in auth.ts (Node only)
  callbacks: {
    // Persist id + role into the JWT at sign-in.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    // Expose id + role on the session object.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
