import { FocusWorkspace } from "@/features/workspace/focus-workspace";
import { youtubeUrlFromSearchRecord } from "@/lib/youtube-url";

export default async function WorkspacePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialYoutubeUrl = youtubeUrlFromSearchRecord(await searchParams);
  return <FocusWorkspace initialYoutubeUrl={initialYoutubeUrl} />;
}
