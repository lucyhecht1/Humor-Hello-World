"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function getInitials(user: { user_metadata?: { full_name?: string; name?: string }; email?: string } | null): string {
  if (!user) return "?";
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  }
  const email = user.email ?? "";
  if (email.length >= 2) return email.slice(0, 2).toUpperCase();
  return "?";
}

export default function AuthButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [signedIn, setSignedIn] = useState(false);
  const [user, setUser] = useState<{ user_metadata?: { full_name?: string; name?: string }; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setUser(session?.user ?? null);
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
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  if (loading) {
    return null;
  }

  if (signedIn) {
    const initials = getInitials(user);
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-transparent py-1.5 pl-1.5 pr-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"
            aria-hidden
          >
            {initials}
          </span>
          Sign out
        </button>

        {showConfirm && (
          <div className="absolute right-0 top-full z-50 mt-1 w-80">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-neutral-900">
                Sign out?
              </h3>
              {user?.email && (
                <p className="mt-1 text-sm text-neutral-500">
                  Signed in as {user.email}
                </p>
              )}
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
