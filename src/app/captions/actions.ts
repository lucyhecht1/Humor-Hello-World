"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitCaptionVote(captionId: string, voteType: 1 | -1) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to vote on captions." };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("caption_votes")
    .upsert(
      {
        caption_id: captionId,
        profile_id: user.id,
        vote_value: voteType,
        created_by_user_id: user.id,
        modified_by_user_id: user.id,
        created_datetime_utc: now,
        modified_datetime_utc: now,
      },
      { onConflict: "caption_id,profile_id" }
    );

  if (error) {
    console.error("Vote upsert error:", error);
    return { error: `Couldn't save your vote: ${error.message}` };
  }

  return { success: true };
}
