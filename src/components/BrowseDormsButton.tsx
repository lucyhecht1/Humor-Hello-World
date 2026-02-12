"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function BrowseDormsButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleBrowseDorms() {
    setChecking(true);
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // User is authenticated, navigate to /list
      router.push("/list");
    } else {
      // User is not authenticated, trigger sign-in
      setLoading(true);
      const origin = window.location.origin;
      
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // IMPORTANT: exactly /auth/callback, no extra query params
          redirectTo: `${origin}/auth/callback`,
        },
      });
    }
    
    setChecking(false);
    setLoading(false);
  }

  return (
    <button
      onClick={handleBrowseDorms}
      disabled={loading || checking}
      className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading || checking ? "Loading..." : "Browse dorms"}
    </button>
  );
}
