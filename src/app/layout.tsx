// src/app/layout.tsx

import { SessionProvider } from "next-auth/react";
import LoginButton from "@/components/LoginButton";

export const metadata = {
  title: "Oudercontact Tracker",
  description: "Beheer oudercontacten",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        {/* SessionProvider om useSession() en signIn/signOut te laten werken */}
        <SessionProvider>
          <header className="p-4 border-b flex justify-end">
            <LoginButton />
          </header>
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
