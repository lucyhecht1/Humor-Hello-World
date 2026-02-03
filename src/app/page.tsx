import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto mt-12 w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Columbia Dorms
        </h1>

        <p className="mt-3 text-gray-600">
          A visual catalog of Columbia housing!
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/list"
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Browse dorms
          </Link>

          <span className="text-xs text-gray-400">
            pulled live from Supabase
          </span>
        </div>
      </div>
    </main>
  );
}
