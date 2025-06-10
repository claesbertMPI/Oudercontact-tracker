import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const laatsteOudercontact = await prisma.oudercontact.findFirst({
    orderBy: { date: "desc" },
  });

  return (
    <main className="p-8 max-w-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">👋 Welkom bij de oudercontacttracker</h1>

      <div className="grid gap-4">
        <Link
          href="/oudercontacten"
          className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded text-center font-semibold"
        >
          📋 Overzicht oudercontacten
        </Link>

        <Link
          href="/oudercontacten/beheer"
          className="block bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded text-center font-semibold"
        >
          ➕ Beheer oudercontactmomenten
        </Link>

        <Link
          href="/statistieken"
          className="block bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded text-center font-semibold"
        >
          📊 Statistieken per oudercontact
        </Link>

        {laatsteOudercontact && (
          <Link
            href={`/oudercontacten/${laatsteOudercontact.id}`}
            className="block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded text-center font-semibold"
          >
            ✅ Laatste checklist: {laatsteOudercontact.title}
          </Link>
        )}
      </div>
    </main>
  );
}
