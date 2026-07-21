import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";
import { normalizeYoutubeUrl, youtubeUrlFromSearchParams } from "@/lib/youtube-url";

const protectedRoutes = ["/dashboard", "/workspace", "/playlists", "/profile"];

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function middleware(request: NextRequest) {
  const sharedYoutubeUrl = youtubeUrlFromSearchParams(request.nextUrl.searchParams);
  const prefixedPathUrl = normalizeYoutubeUrl(
    `${request.nextUrl.pathname.slice(1)}${request.nextUrl.search}`
  );

  if (
    (sharedYoutubeUrl || prefixedPathUrl) &&
    !request.nextUrl.pathname.startsWith("/workspace")
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/workspace";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("url", sharedYoutubeUrl || prefixedPathUrl);
    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const requiresAuth = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (requiresAuth && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/login";
    redirectUrl.searchParams.set("redirectTo", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
