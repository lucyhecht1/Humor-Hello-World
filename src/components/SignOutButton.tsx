"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const supabase = createSupabaseBrowserClient();
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

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

  async function handleSignOut() {
    await supabase.auth.signOut();
    setShowConfirm(false);
  }

  if (loading || !signedIn) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
      >
        Sign out
      </button>

      {showConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />

          {/* Popover */}
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 transform px-4">
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
                  className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
