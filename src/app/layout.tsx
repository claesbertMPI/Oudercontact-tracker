// src/app/layout.tsx

import LoginButton from "@/components/LoginButton";
import { Providers } from "./providers";

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
        {/* Providers is a Client Component, so we can safely use SessionProvider inside it */}
        <Providers>
          <header className="p-4 border-b flex justify-end">
            <LoginButton />
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
