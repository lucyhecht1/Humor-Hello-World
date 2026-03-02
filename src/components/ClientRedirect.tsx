"use client";

import { useEffect } from "react";

/**
 * Redirects to the given path on mount. Used instead of server redirect()
 * so the browser never caches a 307 for the current URL (which can cause
 * redirect loops when the user logs in and navigates back).
 */
export default function ClientRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}
