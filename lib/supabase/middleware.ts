import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedPrefixes = [
  "/dashboard",
  "/companies",
  "/contacts",
  "/meetings",
  "/followups",
  "/pipeline",
  "/documents",
  "/need-help",
  "/reports",
  "/team",
  "/subscription",
  "/settings",
  "/onboarding",
];

const authPrefixes = ["/auth/login", "/auth/register"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    return response;
  }

  const supabaseEnv = getSupabaseEnv();
  const supabase = createServerClient(supabaseEnv.supabaseUrl, supabaseEnv.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    const url = request.nextUrl.clone();
    url.pathname = profile?.organization_id ? "/dashboard" : "/onboarding/workspace";
    return NextResponse.redirect(url);
  }

  if (user && isProtected && !isOnboardingRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.organization_id) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/workspace";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
