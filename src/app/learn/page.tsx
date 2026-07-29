import { FocusWorkspace } from "@/features/workspace/focus-workspace";
import { youtubeUrlFromSearchRecord } from "@/lib/youtube-url";

const DEFAULT_COURSE_URL =
  "https://www.youtube.com/playlist?list=PLhQjrBD2T383q7Vn8QnTsVgSvyLpsqL_R";

export default async function LearnPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialYoutubeUrl =
    youtubeUrlFromSearchRecord(await searchParams) || DEFAULT_COURSE_URL;
  return <FocusWorkspace initialYoutubeUrl={initialYoutubeUrl} />;
}
