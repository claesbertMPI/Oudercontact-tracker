// src/app/auth/signin/SignInClient.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInClient({ callbackUrl }: { callbackUrl: string }) {
  const { status } = useSession(); // only status, no unused session
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  // While loading or signed in, render nothing
  if (status !== "unauthenticated") return null;

  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Inloggen met @mpikompas.be
    </button>
  );
}
