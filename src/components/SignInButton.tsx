"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignInButton() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const origin = window.location.origin;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="flex h-10 cursor-pointer items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Loading..." : "Sign-in"}
    </button>
  );
}
