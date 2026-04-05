"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/captions";

  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setLoading(false);
      if (data.session) {
        router.push(redirectTo);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      if (session) {
        router.push(redirectTo);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase, router, redirectTo]);

  async function signInWithGoogle() {
    setSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>
    );
  }

  if (signedIn) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-orange-200 shadow-sm">
      <div className="bg-orange-500 px-4 py-2.5">
        <span className="font-anton text-lg italic text-white">SIGN IN TO CONTINUE</span>
      </div>
      <div className="bg-white p-8 text-center">
        <p className="text-sm text-gray-600">
          Sign in with Google to vote on captions and access all features.
        </p>
        <button
          onClick={signInWithGoogle}
          disabled={signingIn}
          className="mt-6 inline-flex cursor-pointer items-center bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {signingIn ? "Signing in..." : "Continue with Google"}
        </button>
        <div className="mt-6">
          <Link href="/" className="text-sm text-orange-600 transition hover:text-orange-800">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 pt-20 pb-10">
        <div className="mx-auto w-full max-w-md">
          <Suspense fallback={<div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>}>
            <LoginContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
