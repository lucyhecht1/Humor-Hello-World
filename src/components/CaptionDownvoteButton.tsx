"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CaptionDownvoteButtonProps = {
    captionId: string;
    currentVote: number | null; // 1, -1, null
};

export default function CaptionDownvoteButton({
    captionId,
    currentVote,
}: CaptionDownvoteButtonProps) {
    const supabase = useMemo(() => createSupabaseBrowserClient(), []);
    const [vote, setVote] = useState<number | null>(currentVote);
    const [loading, setLoading] = useState(false);

    // keep in sync if parent updates (ex: re-render from server)
    useEffect(() => setVote(currentVote), [currentVote]);

    async function handleDownvote() {
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
            if (vote === -1) {
                const { error } = await supabase
                    .from("caption_votes")
                    .delete()
                    .eq("caption_id", captionId)
                    .eq("profile_id", session.user.id);

                if (error) throw error;

                setVote(null);
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
                    .update({ vote_value: -1 })
                    .eq("caption_id", captionId)
                    .eq("profile_id", session.user.id);

                if (error) throw error;

                setVote(-1);
            } else {
                const { error } = await supabase.from("caption_votes").insert({
                    caption_id: captionId,
                    profile_id: session.user.id,
                    vote_value: -1,
                    created_datetime_utc: new Date().toISOString(),
                    modified_datetime_utc: new Date().toISOString(),
                });

                if (error) throw error;

                setVote(-1);
            }
        } catch (e) {
            console.error("Vote error:", e);
            alert("Couldn't save your vote. Try again.");
        } finally {
            setLoading(false);
        }
    }

    // Use currentVote from props to ensure sync with other button
    const downSelected = currentVote === -1 || vote === -1;

    return (
        <button
            type="button"
            onClick={handleDownvote}
            disabled={loading}
            aria-pressed={downSelected}
            aria-label={downSelected ? "Remove dislike" : "Dislike"}
            className={[
                "group inline-flex h-14 items-center justify-center rounded-full px-6",
                "transition active:scale-[0.98]",
                downSelected
                    ? "bg-neutral-600 text-white"
                    : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2",
            ].join(" ")}
        >
            <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill={downSelected ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    d="M17 13h2.67A2.31 2.31 0 0022 11V4a2.31 2.31 0 00-2.33-2H17m-7 13v-4a3 3 0 00-3-3l-4 9h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
}
