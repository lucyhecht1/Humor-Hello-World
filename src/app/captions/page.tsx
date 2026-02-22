import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import CaptionVoteButtons from "@/components/CaptionVoteButtons";

export const dynamic = "force-dynamic";

type CaptionRow = {
  id: string;
  content: string;
  created_datetime_utc: string;
  image_id: string | null;
};

type CaptionWithVotes = CaptionRow & {
  vote_count: number;
  user_vote: number | null;
};

export default async function CaptionsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: captionsData, error: captionsError } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id")
    .eq("is_public", true)
    .not("content", "is", null)
    .neq("content", "")
    .order("created_datetime_utc", { ascending: false })
    .limit(50);

  if (captionsError) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-6 pt-24 pb-10">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                Captions
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Something went wrong loading the feed.
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-neutral-950 p-3 text-xs text-neutral-100">
                {captionsError.message}
              </pre>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                >
                  ← Back home
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  const captions = (captionsData ?? []) as CaptionRow[];

  // ----- fetch images (same pattern as friend) -----
  const allImageIds = captions.map((c) => c.image_id).filter(Boolean) as string[];
  const uniqueImageIds = [...new Set(allImageIds)];
  const imagesMap = new Map<string, string>();

  if (uniqueImageIds.length > 0) {
    const CHUNK_SIZE = 100;

    for (let i = 0; i < uniqueImageIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueImageIds.slice(i, i + CHUNK_SIZE);
      const { data: imagesChunk, error: imagesError } = await supabase
        .from("images")
        .select("id, url")
        .in("id", chunk);

      if (imagesError) {
        console.error("Error fetching images chunk:", imagesError);
        continue;
      }

      (imagesChunk ?? []).forEach((img) => {
        if (img.url) imagesMap.set(img.id, img.url);
      });
    }
  }

  // ----- votes -----
  const captionIds = captions.map((c) => c.id);

  const { data: votesData } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value")
    .in("caption_id", captionIds);

  const { data: userVotesData } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value")
    .in("caption_id", captionIds)
    .eq("profile_id", user.id);

  const voteCounts = new Map<string, number>();
  const userVoteMap = new Map<string, number>();

  (votesData ?? []).forEach((v) => {
    const current = voteCounts.get(v.caption_id) || 0;
    voteCounts.set(v.caption_id, current + (v.vote_value === 1 ? 1 : -1));
  });

  (userVotesData ?? []).forEach((v) => {
    userVoteMap.set(v.caption_id, v.vote_value);
  });

  const captionsWithVotes: CaptionWithVotes[] = captions.map((c) => ({
    ...c,
    vote_count: voteCounts.get(c.id) || 0,
    user_vote: userVoteMap.get(c.id) || null,
  }));

  const visibleCaptions = captionsWithVotes.filter(
    (c) => c.image_id && imagesMap.has(c.image_id)
  );

  // List of 20 funny usernames
  const funnyUsernames = [
    "MemeLord3000",
    "PunIntended",
    "DadJokeMaster",
    "ChuckleBerry",
    "GiggleSnort",
    "WittyWizard",
    "LaughTrack",
    "JokeSmuggler",
    "ComedyGold",
    "HahaMachine",
    "SnortLaugh",
    "PunnyBunny",
    "GuffawGuru",
    "ChortleChamp",
    "TeeHeeTitan",
    "GiggleGoblin",
    "LaughingLlama",
    "JokeJuggler",
    "ChuckleChimp",
    "HumorHound",
  ];

  // Function to get a consistent username for a caption based on its ID
  function getUsernameForCaption(captionId: string): string {
    // Simple hash function to get a consistent index
    let hash = 0;
    for (let i = 0; i < captionId.length; i++) {
      const char = captionId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % funnyUsernames.length;
    return funnyUsernames[index];
  }

  // Function to get a gradient for a username
  function getGradientForUsername(username: string): string {
    // Predefined gradient color pairs
    const gradients = [
      "from-pink-400 to-rose-500",
      "from-purple-400 to-pink-500",
      "from-blue-400 to-cyan-500",
      "from-indigo-400 to-purple-500",
      "from-green-400 to-emerald-500",
      "from-yellow-400 to-orange-500",
      "from-red-400 to-pink-500",
      "from-teal-400 to-cyan-500",
      "from-violet-400 to-purple-500",
      "from-amber-400 to-yellow-500",
      "from-lime-400 to-green-500",
      "from-sky-400 to-blue-500",
      "from-fuchsia-400 to-pink-500",
      "from-rose-400 to-red-500",
      "from-cyan-400 to-teal-500",
      "from-emerald-400 to-green-500",
      "from-orange-400 to-red-500",
      "from-blue-500 to-indigo-600",
      "from-purple-500 to-pink-600",
      "from-green-500 to-emerald-600",
    ];

    // Hash the username to get a consistent gradient
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      const char = username.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }

  // Randomize the order of captions
  const shuffledCaptions = [...visibleCaptions].sort(() => Math.random() - 0.5);

  // Toggle: set to true if you want "one post per screen" snapping.
  const SNAP_FEED = false;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-rose-50 px-6 pt-24 pb-10">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
              Captions
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Upvote or downvote captions generated by AI.
            </p>
          </div>

          {/* Feed */}
          <div
            className={[
              "pb-10",
              SNAP_FEED ? "h-[calc(100vh-57px)] overflow-y-auto scroll-smooth" : "",
              SNAP_FEED ? "snap-y snap-mandatory" : "",
            ].join(" ")}
          >
            {visibleCaptions.length === 0 ? (
              <div className="px-4">
                <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                  <p className="text-sm font-medium text-neutral-900">
                    No captions found
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    When people post captions, they’ll show up here.
                  </p>
                  <Link
                    href="/"
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    Go back
                  </Link>
                </div>
              </div>
            ) : (
              shuffledCaptions.map((caption) => {
                const imageUrl = caption.image_id
                  ? imagesMap.get(caption.image_id)
                  : null;
                const username = getUsernameForCaption(caption.id);

                return (
                  <article
                    key={caption.id}
                    className={[
                      "mb-6 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm",
                      SNAP_FEED ? "snap-start" : "",
                    ].join(" ")}
                  >
                    {/* Post "header" row */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full bg-gradient-to-br ${getGradientForUsername(username)}`}
                        />
                        <div className="leading-tight">
                          <div className="text-sm font-semibold text-neutral-900">
                            {username}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {new Date(
                              caption.created_datetime_utc
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      <button
                        className="rounded-full px-2 py-1 text-xl leading-none text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                        aria-label="More"
                        type="button"
                      >
                        …
                      </button>
                    </div>

                    {/* Media */}
                    {imageUrl && (
                      <div className="w-full bg-neutral-100">
                        {/* square + full-bleed like IG */}
                        <div className="aspect-square w-full overflow-hidden">
                          <img
                            src={imageUrl}
                            alt="Caption"
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions (voting) */}
                    <div className="px-4 pt-3">
                      <CaptionVoteButtons
                        captionId={caption.id}
                        currentVote={caption.user_vote}
                        voteCount={caption.vote_count}
                      />

                      {/* Caption text */}
                      <div className="pb-4 pt-2">
                        <p className="text-sm text-neutral-900">
                          <span className="font-semibold">Caption </span>
                          <span className="text-neutral-900/90">
                            {caption.content}
                          </span>
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </main>
    </>
  );
}