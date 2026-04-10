"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const ACCEPT = "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic";

type UploadResult = { cdnUrl: string; captions: string[] };

// ---- Per-result card with selectable captions ----
function ResultCard({ result }: { result: UploadResult }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-orange-200 shadow-sm">
      <div className="rounded-t-2xl bg-orange-500 px-4 py-2.5">
        <span className="font-anton italic text-white">RESULT</span>
      </div>

      <div className="bg-white">
        {/* Side-by-side: image + captions */}
        <div className="flex items-stretch gap-0">
          {/* Image — stretched to fill */}
          <div className="w-[45%] flex-shrink-0 overflow-hidden bg-gray-100">
            <img
              src={result.cdnUrl}
              alt="Uploaded"
              className="h-full w-full object-cover"
              style={{ minHeight: 200 }}
            />
          </div>

          {/* Captions list */}
          <div className="flex flex-1 flex-col gap-0 overflow-y-auto border-l border-orange-100" style={{ maxHeight: 420 }}>
            <p className="sticky top-0 z-10 bg-orange-50 px-3 py-2 font-anton text-xs italic text-orange-600">
              GENERATED CAPTIONS
            </p>
            {result.captions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No captions returned.</p>
            ) : (
              result.captions.map((c, i) => {
                const isSelected = selected === c;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(isSelected ? null : c)}
                    className={`w-full border-b px-3 py-2.5 text-left text-xs leading-snug transition ${
                      isSelected
                        ? "border-orange-300 bg-orange-100 text-orange-900"
                        : "border-gray-100 bg-white text-gray-700 hover:bg-orange-50"
                    }`}
                  >
                    {isSelected && (
                      <span className="mb-0.5 block font-bold text-orange-500 text-[10px] tracking-wide">
                        FAVORITED ✓
                      </span>
                    )}
                    {c}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected caption display — below the image */}
        {selected && (
          <div className="border-t border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-sm text-gray-900">
              <span className="font-bold text-orange-600">Caption: </span>
              {selected}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main upload component ----
export default function UploadClient() {
  const supabase = createSupabaseBrowserClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const key = `uploadResults:${user.id}`;
      setStorageKey(key);
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as UploadResult[];
          if (Array.isArray(parsed)) setResults(parsed);
        } catch { /* ignore */ }
      }
    })();
  }, [supabase]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) { setResults([]); setStorageKey(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  function persist(next: UploadResult[]) {
    if (!storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  async function runPipeline(f: File) {
    setBusy(true);
    setError(null);
    try {
      const presignResp = await fetch("/api/pipeline/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: f.type }),
      });
      const presign = await presignResp.json();
      if (!presignResp.ok) throw new Error(presign?.error || "Presign failed");

      const { presignedUrl, cdnUrl: returnedCdnUrl } = presign;
      if (!presignedUrl || !returnedCdnUrl) throw new Error("Presign response missing presignedUrl/cdnUrl");

      const putResp = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": f.type },
        body: f,
      });
      if (!putResp.ok) {
        const t = await putResp.text().catch(() => "");
        throw new Error(`Upload PUT failed (${putResp.status}): ${t}`);
      }

      const genResp = await fetch("/api/pipeline/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cdnUrl: returnedCdnUrl }),
      });
      const gen = await genResp.json();
      if (!genResp.ok) throw new Error(gen?.error || "Generate captions failed");

      const cdnUrl = gen.cdnUrl ?? returnedCdnUrl;
      const captions = gen.captions ?? [];

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
      {/* Header */}
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
            <div className="mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {busy && (
        <div className="relative mt-4 min-h-[200px] overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-4 flex flex-col gap-4">
        {results.map((result, idx) => (
          <ResultCard key={`${result.cdnUrl}-${idx}`} result={result} />
        ))}
      </div>
    </div>
  );
}
