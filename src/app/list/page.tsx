import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type DormRow = {
  id: number;
  short_name: string;
  full_name: string;
  university_id: number;
  created_at: string;
};

export default async function ListPage() {
  const { data, error } = await supabase
    .from("dorms")
    .select("id, short_name, full_name, university_id, created_at")
    .order("short_name", { ascending: true });

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-6 pt-24 pb-10">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
              Dorms
            </h1>
            <pre className="mt-4 rounded-2xl bg-white/70 border border-neutral-200 p-4 text-sm text-neutral-600">
              {error.message}
            </pre>
          </div>
        </main>
      </>
    );
  }

  const dorms = data ?? [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-6 pt-24 pb-10">
        <div className="mx-auto w-full max-w-6xl">
          {/* Header */}
          <div className="mb-6">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
            Dorms
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {dorms.length} dorms pulled live from Supabase
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dorms.map((dorm: DormRow) => (
            <article
              key={dorm.id}
              className="flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {/* Top content */}
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {dorm.short_name}
                </h2>

                <p className="mt-1 text-sm text-neutral-600">
                  {dorm.full_name}
                </p>
              </div>

              {/* Bottom metadata */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                <span className="rounded-full bg-neutral-100 px-2 py-1">
                  ID: {dorm.id}
                </span>

                <span className="rounded-full bg-neutral-100 px-2 py-1">
                  University ID: {dorm.university_id}
                </span>
              </div>
            </article>
          ))}
        </div>
        </div>
      </main>
    </>
  );
}
