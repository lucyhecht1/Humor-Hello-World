import { redirect } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import Navbar from "@/components/Navbar";
import UploadClient from "@/components/UploadClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-6 pt-24 pb-10">
        <div className="mx-auto w-full max-w-3xl flex justify-center">
          <AuthGate>
            <UploadClient />
          </AuthGate>
        </div>
      </main>
    </>
  );
}
