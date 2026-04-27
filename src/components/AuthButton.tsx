"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();
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
    // Refresh so layout and server components see the updated (signed-out) session
    router.refresh();
    router.push("/login");
  }

  async function signIn() {
    setSigningIn(true);
    const next = pathname ?? "/captions";
    document.cookie = `auth_redirect_to=${encodeURIComponent(next)}; path=/; max-age=300; SameSite=Lax`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  if (loading) {
    return (
      <span className="text-xs font-bold text-orange-200 opacity-60">SIGN IN</span>
    );
  }

  if (signedIn) {
    const initials = getInitials(user);
    return (
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setShowConfirm(true)}
          className="flex cursor-pointer items-center gap-2 transition hover:opacity-80"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-yellow-300 text-xs font-black text-orange-900">
            {initials}
          </span>
          <span className="text-xs font-bold text-yellow-300">SIGN OUT</span>
        </button>

        {showConfirm && (
          <div className="absolute right-0 top-full z-50 mt-1 w-72">
            <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-xl">
              <div className="rounded-t-2xl bg-orange-500 px-4 py-2.5">
                <span className="font-anton italic text-white">Sign out?</span>
              </div>
              <div className="p-4">
                {user?.email && (
                  <p className="text-xs text-gray-500">Signed in as {user.email}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-orange-700"
                  >
                    Sign out
                  </button>
                </div>
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
      className="rounded-lg bg-yellow-300 px-4 py-1.5 font-anton text-sm italic text-orange-900 transition hover:bg-yellow-400 disabled:opacity-50"
    >
      {signingIn ? "..." : "SIGN IN"}
    </button>
  );
}
