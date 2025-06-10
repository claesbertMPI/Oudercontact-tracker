// src/app/auth/signin/page.tsx
"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";

  // Als al ingelogd, direct doorsturen
  if (session) {
    router.push(callbackUrl);
    return null;
  }

  return (
    <div className="p-8 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Inloggen met Google</h1>
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Inloggen met @mpikompas.be
      </button>
    </div>
  );
}
