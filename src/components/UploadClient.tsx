"use client";

import { useRef, useState } from "react";

const ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic";

type UploadResult = { cdnUrl: string; captions: string[] };

export default function UploadClient() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setResults((prev) => [{ cdnUrl, captions }, ...prev]);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-semibold">Caption This!</h1>
      <p className="mt-1 text-black/70">
        Upload an image. We’ll generate the captions.
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
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
          className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Upload image"}
        </button>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {busy && (
        <div className="relative mt-6 min-h-[280px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="absolute inset-0 z-10 flex min-h-[280px] items-center justify-center bg-neutral-200/80">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-400 border-t-indigo-600" />
          </div>
        </div>
      )}

      {results.map((result, idx) => (
        <div
          key={`${result.cdnUrl}-${idx}`}
          className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
        >
          <div className="aspect-square w-full overflow-hidden bg-neutral-100">
            <img
              src={result.cdnUrl}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-4">
            <h2 className="text-sm font-semibold">Captions</h2>
            {result.captions.length === 0 ? (
              <p className="mt-2 text-sm text-black/70">No captions returned.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {result.captions.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-neutral-50 px-3 py-2 text-sm"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}