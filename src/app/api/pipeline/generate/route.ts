import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

const API_BASE = "https://api.almostcrackd.ai";

function extractCaptionText(c: any): string | null {
  if (!c) return null;
  if (typeof c === "string") return c;
  if (typeof c.content === "string") return c.content;
  if (typeof c.caption === "string") return c.caption;
  if (typeof c.text === "string") return c.text;
  return null;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient(req, NextResponse.next());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { cdnUrl } = await req.json().catch(() => ({}));
  if (!cdnUrl || typeof cdnUrl !== "string") {
    return NextResponse.json({ error: "Missing cdnUrl" }, { status: 400 });
  }

  // Step 3: Register image URL
  const regResp = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
  });

  const regText = await regResp.text();
  let reg: any;
  try {
    reg = JSON.parse(regText);
  } catch {
    reg = { raw: regText };
  }

  if (!regResp.ok) {
    return NextResponse.json(
      { error: "Register failed", details: reg },
      { status: regResp.status }
    );
  }

  const imageId = reg?.imageId as string | undefined;
  if (!imageId) {
    return NextResponse.json(
      { error: "No imageId returned", details: reg },
      { status: 502 }
    );
  }

  // Step 4: Generate captions
  const capResp = await fetch(`${API_BASE}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageId }),
  });

  const capText = await capResp.text();
  let cap: any;
  try {
    cap = JSON.parse(capText);
  } catch {
    cap = { raw: capText };
  }

  if (!capResp.ok) {
    return NextResponse.json(
      { error: "Generate captions failed", details: cap, imageId },
      { status: capResp.status }
    );
  }

  const array = Array.isArray(cap) ? cap : [];
  const captions = array
    .map(extractCaptionText)
    .filter((t): t is string => !!t && t.trim().length > 0);

  // IMPORTANT: Do NOT write to Supabase tables here.
  // Upload results stay on /upload only.
  return NextResponse.json({ imageId, cdnUrl, captions, raw: array });
}