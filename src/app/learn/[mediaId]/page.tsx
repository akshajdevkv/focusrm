import { notFound } from "next/navigation";
import { FocusWorkspace } from "@/features/workspace/focus-workspace";

export default async function LearnMediaPage({
  params
}: {
  params: Promise<{ mediaId: string }>;
}) {
  const { mediaId } = await params;
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(mediaId)) notFound();

  const isVideoId = mediaId.length === 11;
  const initialYoutubeUrl = isVideoId
    ? `https://www.youtube.com/watch?v=${mediaId}`
    : `https://www.youtube.com/playlist?list=${mediaId}`;

  return <FocusWorkspace initialYoutubeUrl={initialYoutubeUrl} />;
}
