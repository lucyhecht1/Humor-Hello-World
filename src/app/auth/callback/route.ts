import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/route";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next");
  const cookieRedirect = req.cookies.get("auth_redirect")?.value;
  const decodedRedirect = cookieRedirect ? decodeURIComponent(cookieRedirect) : null;
  const path =
    nextPath && nextPath.startsWith("/")
      ? nextPath
      : decodedRedirect && decodedRedirect.startsWith("/")
        ? decodedRedirect
        : "/captions";

  const res = NextResponse.redirect(new URL(path, url.origin));
  if (cookieRedirect) {
    res.cookies.set("auth_redirect", "", { path: "/", maxAge: 0 });
  }

  if (code) {
    const supabase = createSupabaseRouteClient(req, res);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return res;
}