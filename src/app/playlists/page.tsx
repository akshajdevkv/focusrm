import { PlaylistSearchResults } from "@/features/playlists/playlist-search-results";

export default async function PlaylistsPage({
  searchParams
}: {
  searchParams: Promise<{
    bookmarked?: string | string[];
    search?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const search = Array.isArray(params.search) ? params.search[0] : params.search;
  const bookmarked = Array.isArray(params.bookmarked)
    ? params.bookmarked[0]
    : params.bookmarked;

  return (
    <PlaylistSearchResults
      initialQuery={search || ""}
      initialShowBookmarks={bookmarked === "1"}
      key={`${search || ""}:${bookmarked || ""}`}
    />
  );
}
