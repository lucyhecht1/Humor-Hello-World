import Link from "next/link";
import { redirect } from "next/navigation";
import { type CarouselPost } from "@/components/CaptionCarousel";
import DeckSelector, { type DeckInfo } from "@/components/DeckSelector";
import DeckVoting from "@/components/DeckVoting";
import Navbar from "@/components/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

const DECK_SIZE = 100;

const funnyUsernames = [
  "MemeLord3000","PunIntended","DadJokeMaster","ChuckleBerry","GiggleSnort",
  "WittyWizard","LaughTrack","JokeSmuggler","ComedyGold","HahaMachine",
  "SnortLaugh","PunnyBunny","GuffawGuru","ChortleChamp","TeeHeeTitan",
  "GiggleGoblin","LaughingLlama","JokeJuggler","ChuckleChimp","HumorHound",
];

function stableHash(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getUsernameForCaption(id: string) {
  return funnyUsernames[stableHash(id) % funnyUsernames.length];
}

const gradients = [
  "from-pink-400 to-rose-500","from-purple-400 to-pink-500","from-blue-400 to-cyan-500",
  "from-indigo-400 to-purple-500","from-green-400 to-emerald-500","from-yellow-400 to-orange-500",
  "from-red-400 to-pink-500","from-teal-400 to-cyan-500","from-violet-400 to-purple-500",
  "from-amber-400 to-yellow-500","from-lime-400 to-green-500","from-sky-400 to-blue-500",
  "from-fuchsia-400 to-pink-500","from-rose-400 to-red-500","from-cyan-400 to-teal-500",
  "from-emerald-400 to-green-500","from-orange-400 to-red-500","from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600","from-green-500 to-emerald-600",
];

function getGradientForUsername(username: string) {
  return gradients[stableHash(username) % gradients.length];
}

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }> | { deck?: string };
}) {
  const params = await Promise.resolve(searchParams);
  const activeDeckIndex = params.deck !== undefined ? parseInt(params.deck, 10) : null;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deckParam = activeDeckIndex !== null ? `?deck=${activeDeckIndex}` : "";
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/captions${deckParam}`)}`);

  const { data: captionsData, error: captionsError } = await supabase
    .from("captions")
    .select("id, content, created_datetime_utc, image_id")
    .eq("is_public", true)
    .not("content", "is", null)
    .neq("content", "")
    .order("created_datetime_utc", { ascending: false });

  if (captionsError) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-100 px-6 pt-24 pb-10">
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h1 className="text-lg font-semibold text-neutral-900">Captions</h1>
              <p className="mt-1 text-sm text-neutral-600">Something went wrong loading the feed.</p>
              <pre className="mt-4 overflow-auto rounded-xl bg-neutral-950 p-3 text-xs text-neutral-100">
                {captionsError.message}
              </pre>
              <Link href="/" className="mt-4 inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50">
                ← Back home
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const captions = (captionsData ?? []) as CaptionRow[];

  // Fetch images
  const uniqueImageIds = [...new Set(captions.map((c) => c.image_id).filter(Boolean) as string[])];
  const imagesMap = new Map<string, string>();
  for (let i = 0; i < uniqueImageIds.length; i += 100) {
    const chunk = uniqueImageIds.slice(i, i + 100);
    const { data } = await supabase.from("images").select("id, url").in("id", chunk);
    (data ?? []).forEach((img) => { if (img.url) imagesMap.set(img.id, img.url); });
  }

  // Fetch votes
  const { data: votesData } = await supabase.from("caption_votes").select("caption_id, vote_value");
  const { data: userVotesData } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value, created_datetime_utc")
    .eq("profile_id", user.id)
    .order("created_datetime_utc", { ascending: false });

  const voteCounts = new Map<string, number>();
  (votesData ?? []).forEach((v) => {
    voteCounts.set(v.caption_id, (voteCounts.get(v.caption_id) || 0) + (v.vote_value === 1 ? 1 : -1));
  });

  const userVoteMap = new Map<string, number>();
  (userVotesData ?? []).forEach((v) => {
    if (!userVoteMap.has(v.caption_id)) userVoteMap.set(v.caption_id, v.vote_value);
  });

  const captionsWithVotes: CaptionWithVotes[] = captions.map((c) => ({
    ...c,
    vote_count: voteCounts.get(c.id) || 0,
    user_vote: userVoteMap.get(c.id) ?? null,
  }));

  // Only captions that have images
  const visibleCaptions = captionsWithVotes.filter((c) => c.image_id && imagesMap.has(c.image_id));

  if (visibleCaptions.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-100 px-4 pt-20 pb-10">
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-2xl border border-orange-200 bg-white p-8 text-center shadow-sm">
              <p className="font-bold text-gray-900">No captions found</p>
              <p className="mt-1 text-sm text-gray-600">When people post captions, they'll show up here.</p>
              <Link href="/" className="mt-4 inline-block rounded-xl bg-orange-600 px-5 py-2 font-anton italic text-white hover:bg-orange-700">GO BACK</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Split ALL visible captions into stable decks (by DB order)
  const stableDecks: CaptionWithVotes[][] = [];
  for (let i = 0; i < visibleCaptions.length; i += DECK_SIZE) {
    stableDecks.push(visibleCaptions.slice(i, i + DECK_SIZE));
  }

  // Build DeckInfo for the selector grid
  const deckInfos: DeckInfo[] = stableDecks.map((deck, i) => {
    const total = deck.length;
    const voted = deck.filter((c) => c.user_vote != null).length;
    // Collect up to 4 unique preview image URLs from this deck
    const previewUrls: string[] = [];
    const seenImages = new Set<string>();
    for (const c of deck) {
      if (c.image_id && imagesMap.has(c.image_id) && !seenImages.has(c.image_id)) {
        previewUrls.push(imagesMap.get(c.image_id)!);
        seenImages.add(c.image_id);
        if (previewUrls.length === 4) break;
      }
    }
    return { index: i, total, voted, previewUrls };
  });

  // If a deck is selected, build the voting posts for that deck
  if (activeDeckIndex !== null && activeDeckIndex >= 0 && activeDeckIndex < stableDecks.length) {
    const deckCaptions = stableDecks[activeDeckIndex];
    const unvoted = deckCaptions.filter((c) => c.user_vote == null);

    // Fisher-Yates shuffle within the deck to spread same images apart
    const shuffled = [...unvoted];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const posts: CarouselPost[] = shuffled.map((c) => {
      const username = getUsernameForCaption(c.id);
      return {
        id: c.id,
        content: c.content,
        created_datetime_utc: c.created_datetime_utc,
        image_id: c.image_id,
        vote_count: c.vote_count,
        user_vote: c.user_vote,
        imageUrl: c.image_id ? imagesMap.get(c.image_id) ?? null : null,
        username,
        gradient: getGradientForUsername(username),
      };
    });

    const deckInfo = deckInfos[activeDeckIndex];

    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-100 px-4 pt-20 pb-10">
          <div className="mx-auto w-full max-w-xl">
            <DeckVoting
              posts={posts}
              deckIndex={activeDeckIndex}
              totalInDeck={deckInfo.total}
              alreadyVoted={deckInfo.voted}
            />
          </div>
        </main>
      </>
    );
  }

  // Default: deck selection grid
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 pt-20 pb-10">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-4 overflow-hidden rounded-2xl border border-orange-200 shadow-sm">
            <div className="bg-orange-500 px-4 py-2.5">
              <span className="font-anton text-lg italic text-white">VOTE ON CAPTIONS</span>
            </div>
            <div className="bg-white px-4 py-3">
              <p className="text-sm text-gray-600">Pick a deck and rate 100 AI generated captions. Could you have done better?</p>
            </div>
          </div>
          <DeckSelector decks={deckInfos} />
        </div>
      </main>
    </>
  );
}
