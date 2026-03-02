import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

const API_BASE = "https://api.almostcrackd.ai";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseRouteClient(req, NextResponse.next());
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { contentType } = await req.json().catch(() => ({}));
  if (!contentType || typeof contentType !== "string") {
    return NextResponse.json({ error: "Missing contentType" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });

  const text = await upstream.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Presign failed", details: data },
      { status: upstream.status }
    );
  }

  return NextResponse.json(data);
}