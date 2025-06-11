// src/app/login/SignInClient.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInClient({ callbackUrl }: { callbackUrl: string }) {
  const { status } = useSession();
  const router = useRouter();

  // Redirect immediately when authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  // Only show the button when unauthenticated
  if (status !== "unauthenticated") return null;

  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Login met @mpikompas.be
    </button>
  );
}
