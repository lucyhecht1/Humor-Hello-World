"use client";

import { useRouter } from "next/navigation";

export default function BrowseDormsButton() {
  const router = useRouter();

  function handleBrowseDorms() {
    router.push("/list");
  }

  return (
    <button
      onClick={handleBrowseDorms}
      className="flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
    >
      Browse dorms
    </button>
  );
}
