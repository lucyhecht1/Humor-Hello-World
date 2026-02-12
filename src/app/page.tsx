import BrowseDormsButton from "@/components/BrowseDormsButton";
import SignOutButton from "@/components/SignOutButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-end">
        <SignOutButton />
      </div>
      <div className="mx-auto mt-12 w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Columbia Dorms
        </h1>

        <p className="mt-3 text-gray-600">
          A visual catalog of Columbia housing!
        </p>

        <div className="mt-6 flex items-center gap-3">
          <BrowseDormsButton />

          <span className="text-xs text-gray-400">
            pulled live from Supabase
          </span>
        </div>
      </div>
    </main>
  );
}
