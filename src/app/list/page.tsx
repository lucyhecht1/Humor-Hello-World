import Link from "next/link";
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
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Dorms</h1>
        <pre className="mt-4 rounded bg-black/5 p-3 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

  const dorms = data ?? [];

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Dorms</h1>
            <p className="mt-1 text-sm text-gray-600">
              {dorms.length} dorms pulled live from Supabase
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            ← Back to home
          </Link>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dorms.map((dorm: DormRow) => (
            <article
              key={dorm.id}
              className="flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Top content */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {dorm.short_name}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {dorm.full_name}
                </p>
              </div>

              {/* Bottom metadata */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  ID: {dorm.id}
                </span>

                <span className="rounded-full bg-gray-100 px-2 py-1">
                  University ID: {dorm.university_id}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
