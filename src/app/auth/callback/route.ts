import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  const res = NextResponse.redirect(new URL("/list", url.origin));

  if (code) {
    const supabase = createSupabaseRouteClient(req, res);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return res;
}