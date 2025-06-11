// src/app/login/page.tsx

import SignInClient from "./SignInClient";

export default async function LoginPage(_props: unknown) {
  // 1) Extract and await the searchParams promise
  const searchParams = await (_props as { searchParams: Promise<{ callbackUrl?: string }> }).searchParams;
  const callbackUrl = searchParams.callbackUrl ?? "/";

  // 2) Render as a Server Component
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">Inloggen met Google</h1>
      <SignInClient callbackUrl={callbackUrl} />
    </div>
  );
}
