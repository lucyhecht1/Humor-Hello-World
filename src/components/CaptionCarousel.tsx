"use client";

import { useCallback, useState } from "react";
import CaptionVoteButtons from "@/components/CaptionVoteButtons";

export type CarouselPost = {
  id: string;
  content: string;
  created_datetime_utc: string;
  image_id: string | null;
  vote_count: number;
  user_vote: number | null;
  imageUrl: string | null;
  username: string;
  gradient: string;
};

type Props = {
  posts: CarouselPost[];
  onVote?: (captionId: string) => void;
};

export default function CaptionCarousel({ posts, onVote }: Props) {
  // Already-voted is from DB only: server only passes captions with user_vote == null.
  // votedIds is in-session only (no URL): avoid double vote and advance to next.
  const [index, setIndex] = useState<number>(0);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set());

  const post = posts[index] ?? null;
  const unvotedCount = posts.filter((p) => !votedIds.has(p.id)).length;
  const allVoted = unvotedCount === 0;

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % posts.length);
  }, [posts.length]);

  const handleVote = useCallback(() => {
    if (!post) return;

    setVotedIds((prev) => {
      const next = new Set(prev);
      next.add(post.id);

      // Move to next unvoted caption (stable + deterministic)
      for (let i = index + 1; i < posts.length; i++) {
        if (!next.has(posts[i].id)) {
          setIndex(i);
          return next;
        }
      }

      // If none ahead, try from the beginning (wraparound)
      for (let i = 0; i < index; i++) {
        if (!next.has(posts[i].id)) {
          setIndex(i);
          return next;
        }
      }

      // If everything is voted, keep index where it is
      return next;
    });

    onVote?.(post.id);
  }, [post, index, posts, onVote]);

  if (posts.length === 0) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-xl items-stretch gap-2">
        <article className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm">
          {post && (
            <>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full bg-gradient-to-br ${post.gradient}`}
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-neutral-900">
                      {post.username}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(post.created_datetime_utc).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full px-2 py-1 text-xl leading-none text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                  aria-label="More"
                >
                  …
                </button>
              </div>

              {post.imageUrl && (
                <div className="flex min-h-[280px] w-full items-center justify-center overflow-hidden bg-neutral-100 py-4">
                  <img
                    src={post.imageUrl}
                    alt="Caption"
                    className="max-h-[65vh] max-w-full object-contain"
                  />
                </div>
              )}

              <div className="px-4 pt-3">
                <CaptionVoteButtons
                  key={post.id}
                  captionId={post.id}
                  currentVote={post.user_vote}
                  voteCount={post.vote_count}
                  onVote={handleVote}
                  disabled={votedIds.has(post.id)}
                />

                <div className="pb-4 pt-2">
                  <p className="text-sm text-neutral-900">
                    <span className="font-semibold">Caption </span>
                    <span className="text-neutral-900/90">{post.content}</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </article>

        {/* Next arrow - always clickable */}
        <button
          type="button"
          onClick={goNext}
          className="flex shrink-0 items-center justify-center self-center rounded-full p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Next caption"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Footer: images left or "Your votes are in!" */}
      <p className="mt-4 text-center text-sm text-neutral-600">
        {allVoted ? (
          "Your votes are in!"
        ) : (
          <>
            {unvotedCount} {unvotedCount === 1 ? "image" : "images"} left
          </>
        )}
      </p>
    </div>
  );
}