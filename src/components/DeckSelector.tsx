"use client";

import Link from "next/link";

export type DeckInfo = {
  index: number;
  total: number;
  voted: number;
  previewUrls: string[];
};

type Props = {
  decks: DeckInfo[];
};

export default function DeckSelector({ decks }: Props) {
  const allComplete = decks.every((d) => d.voted === d.total);

  if (allComplete) {
    return (
      <div className="rounded-2xl border border-orange-200 bg-white p-8 text-center shadow-sm">
        <p className="text-2xl font-bold text-gray-900">All done!</p>
        <p className="mt-2 text-sm text-gray-600">You've voted on every caption. Check back later for more.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-orange-600 px-5 py-2 font-anton italic text-white hover:bg-orange-700">
          GO BACK
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {decks.map((deck) => {
        const pct = deck.total > 0 ? Math.round((deck.voted / deck.total) * 100) : 0;
        const complete = deck.voted === deck.total;
        const started = deck.voted > 0 && !complete;

        return (
          <Link
            key={deck.index}
            href={`/captions?deck=${deck.index}`}
            className={`group flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md active:scale-[0.98] ${
              complete
                ? "border-green-300 bg-green-50"
                : "border-orange-200 bg-white hover:border-orange-400"
            }`}
          >
            {/* Image mosaic */}
            <div className="relative flex-shrink-0 overflow-hidden bg-blue-50" style={{ aspectRatio: "4/3" }}>
              {deck.previewUrls.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-10 w-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              ) : deck.previewUrls.length === 1 ? (
                <img src={deck.previewUrls[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="overflow-hidden bg-blue-100">
                      {deck.previewUrls[i] ? (
                        <img src={deck.previewUrls[i]} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {/* Status badge */}
              <div className="absolute left-2 top-2">
                {complete ? (
                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    DONE
                  </span>
                ) : started ? (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    IN PROGRESS
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-800/70 px-2 py-0.5 text-[10px] font-bold text-white">
                    NEW
                  </span>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="flex flex-col gap-2 p-3">
              <p className="font-anton text-sm italic text-gray-900">
                DECK {deck.index + 1}
              </p>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-1.5 rounded-full transition-all ${complete ? "bg-green-500" : "bg-orange-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-xs text-gray-500">
                {complete ? "All voted!" : `${deck.voted} / ${deck.total} voted`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
