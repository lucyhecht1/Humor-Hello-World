"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { submitCaptionVote } from "@/app/captions/actions";
import { type CarouselPost } from "@/components/CaptionCarousel";

type Props = {
  posts: CarouselPost[];
  deckIndex: number;
  totalInDeck: number;
  alreadyVoted: number;
};

export default function DeckVoting({ posts, deckIndex, totalInDeck, alreadyVoted }: Props) {
  const [index, setIndex] = useState(0);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);

  const post = posts[index] ?? null;
  const sessionVoted = votedIds.size;
  const totalVoted = alreadyVoted + sessionVoted;
  const allDone = posts.length === 0 || sessionVoted === posts.length;

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % posts.length);
  }, [posts.length]);

  const handleVote = useCallback(async (voteType: 1 | -1) => {
    if (!post || loading) return;
    setLoading(true);
    try {
      const result = await submitCaptionVote(post.id, voteType);
      if (result.error) { alert(result.error); return; }

      setVotedIds((prev) => {
        const next = new Set(prev);
        next.add(post.id);

        // Advance to next unvoted
        for (let i = index + 1; i < posts.length; i++) {
          if (!next.has(posts[i].id)) { setIndex(i); return next; }
        }
        for (let i = 0; i < index; i++) {
          if (!next.has(posts[i].id)) { setIndex(i); return next; }
        }
        return next;
      });
    } catch {
      alert("Couldn't save your vote. Try again.");
    } finally {
      setLoading(false);
    }
  }, [post, index, posts, loading]);

  const pct = totalInDeck > 0 ? (totalVoted / totalInDeck) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Back + deck label */}
      <div className="flex items-center gap-3">
        <Link
          href="/captions"
          className="flex items-center gap-1 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-orange-50"
        >
          ← Decks
        </Link>
        <span className="font-anton text-sm italic text-orange-700">DECK {deckIndex + 1}</span>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between px-0.5 text-sm">
        <span className="font-medium text-gray-700">{totalVoted} / {totalInDeck} voted</span>
        <span className="text-gray-400">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-2 rounded-full bg-orange-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Done state */}
      {allDone ? (
        <div className="rounded-2xl border border-orange-200 bg-white p-8 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">Deck {deckIndex + 1} complete!</p>
          <p className="mt-2 text-sm text-gray-600">Nice work. Head back to pick another deck.</p>
          <Link
            href="/captions"
            className="mt-6 inline-block rounded-xl bg-orange-600 px-6 py-2.5 font-anton italic text-white hover:bg-orange-700"
          >
            ← BACK TO DECKS
          </Link>
        </div>
      ) : (
        <div className="relative">
          {post && (
            <article className="w-full overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-2 rounded-t-2xl bg-orange-500 px-4 py-2.5">
                <div className={`h-6 w-6 rounded-sm bg-gradient-to-br ${post.gradient}`} />
                <span className="font-anton italic text-sm text-white">{post.username}</span>
                <span className="ml-auto text-xs text-orange-200">
                  {new Date(post.created_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {/* Image */}
              {post.imageUrl && (
                <div className="flex min-h-[280px] w-full items-center justify-center overflow-hidden bg-gray-100 py-4">
                  <img src={post.imageUrl} alt="Caption" className="max-h-[65vh] max-w-full object-contain" />
                </div>
              )}

              {/* Caption + votes */}
              <div className="px-4 pb-4 pt-3">
                <p className="mb-4 text-sm text-gray-900">
                  <span className="font-bold text-orange-600">Caption: </span>
                  {post.content}
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleVote(1)}
                    disabled={loading || votedIds.has(post.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-100 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {loading ? "..." : "Like"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(-1)}
                    disabled={loading || votedIds.has(post.id)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-neutral-100 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-200 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" />
                    </svg>
                    {loading ? "..." : "Pass"}
                  </button>
                </div>
              </div>
            </article>
          )}

          {/* Skip button */}
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+12px)] rounded-xl bg-orange-600 p-3 text-white shadow-md transition hover:bg-orange-700"
            aria-label="Skip"
          >
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
