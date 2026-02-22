import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Redirect to /captions after authentication (for voting on captions)
  const res = NextResponse.redirect(new URL("/captions", url.origin));

  if (code) {
    const supabase = createSupabaseRouteClient(req, res);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return res;
}