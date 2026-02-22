"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowConfirm(false);
      }
    }

    if (showConfirm) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showConfirm]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setShowConfirm(false);
    // Redirect to login page after signing out
    router.push("/login");
  }

  async function signIn() {
    setSigningIn(true);
    const origin = window.location.origin;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  }

  if (loading) {
    return null;
  }

  if (signedIn) {
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex h-10 cursor-pointer items-center justify-center px-4 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
        >
          Sign out
        </button>

        {showConfirm && (
          <div className="absolute right-0 top-full z-50 mt-1 w-80">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-neutral-900">
                Sign out?
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                Are you sure you want to sign out?
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      disabled={signingIn}
      className="inline-flex h-10 cursor-pointer items-center justify-center px-4 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {signingIn ? "Loading..." : "Sign in"}
    </button>
  );
}
