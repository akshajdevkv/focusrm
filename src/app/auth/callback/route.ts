import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestHost = request.headers.get("host");
  const publicOrigin = requestHost
    ? `${requestUrl.protocol}//${requestHost}`
    : requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const authErrorCode = requestUrl.searchParams.get("error_code");
  const authErrorDescription = requestUrl.searchParams.get("error_description");
  const requestedNext = requestUrl.searchParams.get("next");
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";
  if (authError || authErrorCode) {
    const loginUrl = new URL("/auth/login", publicOrigin);
    loginUrl.searchParams.set(
      "error",
      authErrorDescription || "Email confirmation could not be completed. Please try again."
    );
    if (authErrorCode) loginUrl.searchParams.set("error_code", authErrorCode);
    return NextResponse.redirect(loginUrl);
  }
  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL("/auth/login", publicOrigin);
      loginUrl.searchParams.set("error", "Authentication could not be completed. Please try again.");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL(nextPath, publicOrigin));
}
