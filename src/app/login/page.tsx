import AuthGate from "@/components/AuthGate";

export default function LoginPage() {
  return (
    <AuthGate>
      <h1 className="text-2xl font-semibold">You’re signed in ✅</h1>
      <p className="mt-2 text-black/70">Go to /protected.</p>
    </AuthGate>
  );
}
