// src/app/page.tsx

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  // 1) Guard: if not logged in, send to /login
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // 2) Pull out the user’s email
  const email = session.user?.email;

  return (
    <main className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Oudercontact Tracker</h1>

      <nav className="space-y-2">
        <Link
          href="/oudercontacten/statistieken"
          className="block text-blue-600 hover:underline"
        >
          📊 Statistieken
        </Link>

        <Link
          href="/oudercontacten"
          className="block text-blue-600 hover:underline"
        >
          📋 Overzicht oudercontacten
        </Link>

        {email === "bert.claes@mpikompas.be" && (
          <Link
            href="/oudercontacten/beheer"
            className="block text-red-600 hover:underline font-semibold"
          >
            🛠️ Admin
          </Link>
        )}
      </nav>
    </main>
  );
}
