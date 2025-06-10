// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          hd: "mpikompas.be", // restrict to your G Suite domain
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ profile }) {
      return profile?.email?.endsWith("@mpikompas.be") ?? false;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error:  "/auth/error",
  },
});

export { handler as GET, handler as POST };
