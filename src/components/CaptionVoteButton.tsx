"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CaptionVoteButtonProps = {
    captionId: string;
    currentVote: number | null; // 1, -1, null
    voteCount: number; // net score
};

export default function CaptionVoteButton({
    captionId,
    currentVote,
    voteCount,
}: CaptionVoteButtonProps) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [vote, setVote] = useState<number | null>(currentVote);
    const [count, setCount] = useState<number>(voteCount);
    const [loading, setLoading] = useState(false);

    // keep in sync if parent updates (ex: re-render from server)
    useEffect(() => setVote(currentVote), [currentVote]);
    useEffect(() => setCount(voteCount), [voteCount]);

    async function handleVote(voteType: number) {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
            alert("Please sign in to vote on captions.");
            return;
        }

        setLoading(true);

        try {
            // toggle off
            if (vote === voteType) {
                const { error } = await supabase
                    .from("caption_votes")
                    .delete()
                    .eq("caption_id", captionId)
                    .eq("profile_id", session.user.id);

                if (error) throw error;

                setVote(null);
                setCount((prev) => prev - voteType);
                return;
            }

            // see if vote exists
            const { data: existingVote, error: existingErr } = await supabase
                .from("caption_votes")
                .select("id, vote_value")
                .eq("caption_id", captionId)
                .eq("profile_id", session.user.id)
                .maybeSingle();

            if (existingErr) throw existingErr;

            if (existingVote) {
                const { error } = await supabase
                    .from("caption_votes")
                    .update({ vote_value: voteType })
                    .eq("caption_id", captionId)
                    .eq("profile_id", session.user.id);

                if (error) throw error;

                const oldVoteType = existingVote.vote_value;
                setVote(voteType);
                setCount((prev) => prev - oldVoteType + voteType);
            } else {
                const { error } = await supabase.from("caption_votes").insert({
                    caption_id: captionId,
                    profile_id: session.user.id,
                    vote_value: voteType,
                    created_datetime_utc: new Date().toISOString(),
                    modified_datetime_utc: new Date().toISOString(),
                });

                if (error) throw error;

                setVote(voteType);
                setCount((prev) => prev + voteType);
            }
        } catch (e) {
            console.error("Vote error:", e);
            alert("Couldn't save your vote. Try again.");
        } finally {
            setLoading(false);
        }
    }

    // Use currentVote from props to ensure sync with other button
    const likeSelected = currentVote === 1 || vote === 1;

    // IG-ish: show “likes” style number (positive only), but you can switch to net easily.
    const displayLikes = Math.max(0, count);

    return (
        <button
            type="button"
            onClick={() => handleVote(1)}
            disabled={loading}
            aria-pressed={likeSelected}
            aria-label={likeSelected ? "Remove like" : "Like"}
            className={[
                "group inline-flex h-14 items-center justify-center rounded-full px-6",
                "transition active:scale-[0.98]",
                likeSelected
                    ? "bg-rose-600 text-white"
                    : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2",
            ].join(" ")}
        >
            {likeSelected ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            ) : (
                <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                </svg>
            )}
        </button>
    );
}