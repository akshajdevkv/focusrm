import { notFound, redirect } from "next/navigation";
import { normalizeYoutubeUrl, youtubeUrlFromSearchRecord } from "@/lib/youtube-url";

export default async function SharedYoutubeUrlPage({
  params,
  searchParams
}: {
  params: Promise<{ sharedYoutubeUrl?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ sharedYoutubeUrl = [] }, query] = await Promise.all([params, searchParams]);
  const sharedPath = sharedYoutubeUrl.join("/");
  const queryString = new URLSearchParams(
    Object.entries(query).flatMap(([key, value]) => {
      if (!value) return [];
      return [[key, Array.isArray(value) ? value[0] : value]];
    })
  ).toString();
  const pathUrl = normalizeYoutubeUrl(sharedPath);
  const pathWithQueryUrl = normalizeYoutubeUrl(
    queryString ? `${sharedPath}?${queryString}` : sharedPath
  );
  const queryUrl = youtubeUrlFromSearchRecord(query);
  const youtubeUrl = pathWithQueryUrl || queryUrl || pathUrl;

  if (!youtubeUrl) notFound();

  redirect(`/workspace?url=${encodeURIComponent(youtubeUrl)}`);
}
