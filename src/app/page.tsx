import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

async function getHomePageData() {
  const [captionsRes, votesRes] = await Promise.all([
    supabase
      .from("captions")
      .select("id, content, image_id")
      .eq("is_public", true)
      .not("content", "is", null)
      .neq("content", ""),
    supabase.from("caption_votes").select("caption_id, vote_value"),
  ]);

  const captions = captionsRes.data ?? [];
  const votes = votesRes.data ?? [];

  const voteCounts = new Map<string, number>();
  for (const v of votes) {
    voteCounts.set(v.caption_id, (voteCounts.get(v.caption_id) ?? 0) + (v.vote_value === 1 ? 1 : -1));
  }

  const scored = captions.map((c) => ({ ...c, score: voteCounts.get(c.id) ?? 0 }));
  const withVotes = scored.filter((c) => voteCounts.has(c.id));

  const best = withVotes.length > 0
    ? withVotes.reduce((a, b) => (b.score > a.score ? b : a))
    : null;

  const shame = [...withVotes].sort((a, b) => a.score - b.score).slice(0, 3);

  const imageIds = [...new Set(
    [best, ...shame].filter(Boolean).map((c) => c!.image_id).filter(Boolean) as string[]
  )];

  const imagesMap = new Map<string, string>();
  if (imageIds.length > 0) {
    const { data: imgs } = await supabase.from("images").select("id, url").in("id", imageIds);
    for (const img of imgs ?? []) {
      if (img.url) imagesMap.set(img.id, img.url);
    }
  }

  return {
    best: best ? { ...best, imageUrl: best.image_id ? imagesMap.get(best.image_id) ?? null : null } : null,
    shame: shame.map((c) => ({ ...c, imageUrl: c.image_id ? imagesMap.get(c.image_id) ?? null : null })),
  };
}

function Window({ title, children, headerBg = "bg-orange-500" }: { title: React.ReactNode; children: React.ReactNode; headerBg?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-orange-200 shadow-sm">
      <div className={`${headerBg} px-4 py-2.5`}>
        <span className="font-anton text-lg italic text-white">{title}</span>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}

export default async function Home() {
  const { best, shame } = await getHomePageData();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-100 px-4 pt-20 pb-10">
        <div className="mx-auto max-w-5xl">

          {/* Hero */}
          <div className="mb-8 text-center">
            <h1
              className="font-anton text-8xl italic text-orange-600 leading-none sm:text-9xl"
              style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.1)" }}
            >
              LLMFAO
            </h1>
            <p className="mt-3 text-base text-stone-500">
              AI writes the jokes. You decide if they&apos;re funny.
            </p>
          </div>

          {/* Action cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Window title="VOTE ON CAPTIONS" headerBg="bg-yellow-400">
              <div className="p-5">
                <p className="text-sm text-gray-600">
                  The AI tried its best. Now you be the judge. Vote captions up or down if they're funny or not.
                </p>
                <Link
                  href="/captions"
                  className="mt-4 inline-block rounded-xl bg-orange-600 px-5 py-2 font-anton italic text-white transition hover:bg-orange-700"
                >
                  VOTE NOW
                </Link>
              </div>
            </Window>

            <Window title="CAPTION THIS!" headerBg="bg-yellow-400">
              <div className="p-5">
                <p className="text-sm text-gray-600">
                  Upload a photo, hand it to the agent. Can AI read the room? Results may vary wildly.
                </p>
                <Link
                  href="/upload"
                  className="mt-4 inline-block rounded-xl bg-orange-600 px-5 py-2 font-anton italic text-white transition hover:bg-orange-700"
                >
                  UPLOAD
                </Link>
              </div>
            </Window>
          </div>

          {/* Data windows */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">

            <Window title="CAPTION OF THE DAY">
              {best ? (
                <div className="p-5">
                  {best.imageUrl && (
                    <div className="relative mb-3 h-64 w-full overflow-hidden rounded-xl bg-gray-100">
                      <Image src={best.imageUrl} alt="caption image" fill className="object-cover" />
                    </div>
                  )}
                  <p className="text-sm italic text-gray-700 leading-relaxed">
                    &ldquo;{best.content}&rdquo;
                  </p>
                  <p className="mt-2 text-xs font-bold text-orange-500">
                    ▲ {best.score} {best.score === 1 ? "vote" : "votes"}
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  No votes yet — be the first!
                </div>
              )}
            </Window>

            <Window title="HALL OF SHAME">
              {shame.length > 0 ? (
                <ul className="flex h-full flex-col divide-y divide-gray-100">
                  {shame.map((c, i) => (
                    <li key={c.id} className="flex flex-1 items-center gap-3 p-4">
                      <span className="font-anton text-lg italic text-orange-300 leading-none pt-0.5">
                        {i + 1}.
                      </span>
                      {c.imageUrl && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <Image src={c.imageUrl} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs text-gray-600 leading-snug italic">
                          &ldquo;{c.content}&rdquo;
                        </p>
                        <span className="text-xs font-bold text-red-400">
                          ▼ {Math.abs(c.score)} {Math.abs(c.score) === 1 ? "downvote" : "downvotes"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-6 text-center text-sm text-gray-400">
                  No shame yet — vote some captions down!
                </div>
              )}
            </Window>

          </div>

          <div className="mt-8 text-center text-xs text-stone-400">
            Built with Next.js + Supabase.
          </div>
        </div>
      </main>
    </>
  );
}
