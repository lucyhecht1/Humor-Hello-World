import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-center border-b border-neutral-200 bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-900 transition hover:text-indigo-600"
          >
            Home
          </Link>
          <Link
            href="/list"
            className="text-sm font-semibold text-neutral-900 transition hover:text-indigo-600"
          >
            Dorms
          </Link>
          <Link
            href="/captions"
            className="text-sm font-semibold text-neutral-900 transition hover:text-indigo-600"
          >
            Captions
          </Link>
        </div>
        <AuthButton />
      </div>
    </nav>
  );
}
