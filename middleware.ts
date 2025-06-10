// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/signin",  // waar gebruikers heen gaan om in te loggen
  },
});

// Zorg dat álle routes onder /oudercontacten worden beschermd.
export const config = {
  matcher: ["/oudercontacten/:path*"],
};
