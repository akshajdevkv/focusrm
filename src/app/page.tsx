import { redirect } from "next/navigation";
import { GlossyLanding } from "@/features/landing/glossy-landing";
import { youtubeUrlFromSearchRecord } from "@/lib/youtube-url";

export default async function LandingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const youtubeUrl = youtubeUrlFromSearchRecord(await searchParams);
  if (youtubeUrl) redirect(`/workspace?url=${encodeURIComponent(youtubeUrl)}`);

  return <GlossyLanding />;
}
