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
      <div className="relative w-full">
        <article className="w-full overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          {post && (
            <>
              {/* Post header */}
              <div className="flex items-center justify-between rounded-t-2xl bg-orange-500 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-sm bg-gradient-to-br ${post.gradient}`} />
                  <span className="font-anton italic text-sm text-white">{post.username}</span>
                  <span className="text-xs text-orange-200">
                    {new Date(post.created_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              </div>

              {post.imageUrl && (
                <div className="flex min-h-[280px] w-full items-center justify-center overflow-hidden bg-gray-100 py-4">
                  <img src={post.imageUrl} alt="Caption" className="max-h-[65vh] max-w-full object-contain" />
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
                  <p className="text-sm text-gray-900">
                    <span className="font-bold text-orange-600">Caption: </span>
                    {post.content}
                  </p>
                </div>
              </div>
            </>
          )}
        </article>

        <button
          type="button"
          onClick={goNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+12px)] rounded-xl bg-orange-600 p-3 text-white shadow-md transition hover:bg-orange-700"
          aria-label="Next caption"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <p className="mt-3 text-center text-sm font-bold text-orange-800">
        {allVoted ? "YOUR VOTES ARE IN!" : `${unvotedCount} ${unvotedCount === 1 ? "image" : "images"} left`}
      </p>
    </div>
  );
}