import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  // Next 15+: cookies() is async
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Next cookie store uses getAll() in some versions, but in others it's different.
          // This is the most compatible approach:
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In server components, we can't modify cookies.
          // This is read-only for server components - cookies are only set in Route Handlers/Server Actions.
          // For server components that only read data, we skip setting cookies.
          // Cookies will be properly managed in Route Handlers (like /auth/callback)
          // This is a no-op for server components to avoid the Next.js cookie modification error.
        },
      },
    }
  );
}
