import Link from "next/link";
import AuthButton from "@/components/AuthButton";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-orange-600 shadow-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="font-anton text-2xl italic text-yellow-300 leading-none transition hover:text-yellow-200"
            style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.3)" }}
          >
            LLMFAO
          </Link>
          <nav className="flex items-center gap-1">
            {[
              { href: "/captions", label: "Rate Captions" },
              { href: "/upload", label: "Upload" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-500"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <AuthButton />
      </div>
    </header>
  );
}
