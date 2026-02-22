"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VoteButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function handleVote() {
    if (isAuthenticated) {
      // User is authenticated, navigate to captions page
      router.push("/captions");
    } else {
      // User is not authenticated, trigger sign-in
      setLoading(true);
      const origin = window.location.origin;
      
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
    }
  }

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <button
        disabled
        className="inline-flex h-10 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className="inline-flex h-10 cursor-pointer items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Loading..." : "Vote"}
    </button>
  );
}
