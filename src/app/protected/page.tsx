import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AuthGate from "@/components/AuthGate";

export default async function ProtectedPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  return (
    <AuthGate>
      <h1 className="text-2xl font-semibold">Protected Route ✅</h1>
      <p className="mt-2 text-black/70">
        You’re signed in, and this route is protected.
      </p>
    </AuthGate>
  );
}
