import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import UploadClient from "@/components/UploadClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/upload");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 pt-20 pb-10">
        <div className="mx-auto w-full max-w-xl">
          <UploadClient />
        </div>
      </main>
    </>
  );
}
