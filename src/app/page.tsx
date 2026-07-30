import { redirect } from "next/navigation";
import { GlossyLanding } from "@/features/landing/glossy-landing";
import { youtubePlaylistId, youtubeUrlFromSearchRecord, youtubeVideoId } from "@/lib/youtube-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function displayName(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const metadataName = [
    user.user_metadata?.display_name,
    user.user_metadata?.full_name,
    user.user_metadata?.name
  ].find((value) => typeof value === "string" && value.trim()) as string | undefined;
  if (metadataName) return metadataName.trim().split(/\s+/)[0];

  const emailName = user.email?.split("@")[0].replace(/[._-]+/g, " ").trim();
  if (!emailName) return "Learner";
  return emailName.charAt(0).toUpperCase() + emailName.slice(1);
}

export default async function LandingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const authError = Array.isArray(params.error) ? params.error[0] : params.error;
  const authErrorCode = Array.isArray(params.error_code)
    ? params.error_code[0]
    : params.error_code;
  const authErrorDescription = Array.isArray(params.error_description)
    ? params.error_description[0]
    : params.error_description;
  if (authError || authErrorCode) {
    const loginParams = new URLSearchParams();
    loginParams.set(
      "error",
      authErrorDescription || "Email confirmation could not be completed. Please try again."
    );
    if (authErrorCode) loginParams.set("error_code", authErrorCode);
    redirect(`/auth/login?${loginParams.toString()}`);
  }

  const youtubeUrl = youtubeUrlFromSearchRecord(params);
  if (youtubeUrl) {
    const videoId = youtubeVideoId(youtubeUrl);
    const mediaId = youtubePlaylistId(youtubeUrl) || videoId;
    redirect(mediaId ? `/learn/${mediaId}` : `/learn?url=${encodeURIComponent(youtubeUrl)}`);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <GlossyLanding userName={user ? displayName(user) : ""} />;
}
