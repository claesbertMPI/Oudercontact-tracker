"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="p-4">Bezig met laden...</p>;
  }

  if (!session) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-2xl mb-4 font-bold">Welkom bij de Oudercontact Tracker</h1>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Inloggen met Google
        </button>
      </main>
    );
  }

  return (
    <main className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">Welkom, {session.user?.name}!</h1>
      <p className="mb-6 text-gray-600">{session.user?.email}</p>

      <button
        onClick={() => signOut()}
        className="bg-gray-700 text-white px-4 py-2 rounded"
      >
        Uitloggen
      </button>
    </main>
  );
}
