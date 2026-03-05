import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "USER";
      } else if (!token.role && token.email) {
        const db = await prisma.user.findUnique({ where: { email: token.email }, select: { role: true } });
        token.role = db?.role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = (token as any).role ?? "USER";
      return session;
    },
  },
});
