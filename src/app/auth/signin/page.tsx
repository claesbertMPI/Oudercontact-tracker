// src/app/auth/signin/page.tsx

import SignInClient from "./SignInClient";

export default function SignInPage(_props: unknown) {
  // Cast _props into the shape Next.js actually passes us:
  const { searchParams } = _props as { searchParams: { callbackUrl?: string } };
  const callbackUrl = searchParams.callbackUrl ?? "/";

  return (
    <div className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Inloggen met Google</h1>
      <SignInClient callbackUrl={callbackUrl} />
    </div>
  );
}
