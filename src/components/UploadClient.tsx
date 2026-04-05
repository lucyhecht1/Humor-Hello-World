"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic";

type UploadResult = { cdnUrl: string; captions: string[] };

export default function UploadClient() {
  const supabase = createSupabaseBrowserClient();

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  // localStorage key scoped to the logged-in user
  const [storageKey, setStorageKey] = useState<string | null>(null);

  // Load saved uploads for this user on mount
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const key = `uploadResults:${user.id}`;
      setStorageKey(key);

      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as UploadResult[];
          if (Array.isArray(parsed)) setResults(parsed);
        } catch {
          // ignore malformed JSON
        }
      }
    })();
  }, [supabase]);

  // If user logs out, clear in-memory state (optional but avoids mixing users)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setResults([]);
        setStorageKey(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  function persist(next: UploadResult[]) {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.error("localStorage persist failed:", e);
    }
  }

  async function runPipeline(f: File) {
    setBusy(true);
    setError(null);

    try {
      // Step 1: ask our server for a presigned URL
      const presignResp = await fetch("/api/pipeline/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: f.type }),
      });

      const presign = await presignResp.json();
      if (!presignResp.ok) {
        throw new Error(presign?.error || "Presign failed");
      }

      const { presignedUrl, cdnUrl: returnedCdnUrl } = presign;
      if (!presignedUrl || !returnedCdnUrl) {
        throw new Error("Presign response missing presignedUrl/cdnUrl");
      }

      // Step 2: PUT bytes directly to the presigned URL (S3)
      const putResp = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": f.type },
        body: f,
      });

      if (!putResp.ok) {
        const t = await putResp.text().catch(() => "");
        throw new Error(`Upload PUT failed (${putResp.status}): ${t}`);
      }

      // Steps 3+4: register + generate captions (through our server)
      const genResp = await fetch("/api/pipeline/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cdnUrl: returnedCdnUrl }),
      });

      const gen = await genResp.json();
      if (!genResp.ok) {
        throw new Error(gen?.error || "Generate captions failed");
      }

      const cdnUrl = gen.cdnUrl ?? returnedCdnUrl;
      const captions = gen.captions ?? [];

      // Save in React state + localStorage (keep latest 25)
      setResults((prev) => {
        const next = [{ cdnUrl, captions }, ...prev].slice(0, 25);
        persist(next);
        return next;
      });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      {/* Header window */}
      <div className="overflow-hidden rounded-2xl border border-orange-200 shadow-sm">
        <div className="bg-orange-500 px-4 py-2.5">
          <span className="font-anton text-lg italic text-white">UPLOAD &amp; CAPTION</span>
        </div>
        <div className="bg-white p-5">
          <p className="text-sm text-gray-600">Upload an image. AI will generate the captions.</p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const chosen = e.target.files?.[0] ?? null;
              if (chosen) runPipeline(chosen);
              e.target.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => !busy && inputRef.current?.click()}
            disabled={busy}
            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-orange-600 px-4 py-3 font-anton italic text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "UPLOADING…" : "UPLOAD IMAGE"}
          </button>

          {error && (
            <div className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {busy && (
        <div className="relative mt-4 min-h-[280px] overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="h-10 w-10 animate-spin border-2 border-orange-200 border-t-orange-600" />
          </div>
        </div>
      )}

      {results.map((result, idx) => (
        <div
          key={`${result.cdnUrl}-${idx}`}
          className="mt-4 overflow-hidden rounded-2xl border border-orange-200 shadow-sm"
        >
          <div className="rounded-t-2xl bg-orange-500 px-4 py-2.5">
            <span className="font-anton italic text-white">RESULT</span>
          </div>
          <div className="bg-white">
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
              <img src={result.cdnUrl} alt="Uploaded" className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <p className="font-anton italic text-orange-600">CAPTIONS:</p>
              {result.captions.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">No captions returned.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {result.captions.map((c, i) => (
                    <li key={i} className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}