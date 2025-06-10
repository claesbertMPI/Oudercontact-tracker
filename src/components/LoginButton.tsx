// src/components/LoginButton.tsx
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button onClick={() => signOut()} className="text-sm text-gray-700">
        Afmelden ({session.user?.email})
      </button>
    );
  }
  return (
    <button
      onClick={() => signIn("google")}
      className="text-sm text-gray-700"
    >
      Inloggen
    </button>
  );
}
