import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  // Prefer the `next` query param; fall back to the cookie set before OAuth started
  const queryNext = url.searchParams.get("next");
  const cookieNext = req.cookies.get("auth_redirect_to")?.value;
  const rawNext = queryNext ?? (cookieNext ? decodeURIComponent(cookieNext) : null);
  const path = rawNext && rawNext.startsWith("/") ? rawNext : "/captions";

  const res = NextResponse.redirect(new URL(path, url.origin));
  // Clear the redirect cookie now that we've consumed it
  res.cookies.set("auth_redirect_to", "", { maxAge: 0, path: "/" });

  if (code) {
    const supabase = createSupabaseRouteClient(req, res);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return res;
}
