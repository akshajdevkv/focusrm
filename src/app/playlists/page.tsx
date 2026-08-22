import { PlaylistSearchResults } from "@/features/playlists/playlist-search-results";

export default async function PlaylistsPage({
  searchParams
}: {
  searchParams: Promise<{
    bookmarked?: string | string[];
    import?: string | string[];
    search?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const search = Array.isArray(params.search) ? params.search[0] : params.search;
  const bookmarked = Array.isArray(params.bookmarked)
    ? params.bookmarked[0]
    : params.bookmarked;
  const importYoutube = Array.isArray(params.import) ? params.import[0] : params.import;

  return (
    <PlaylistSearchResults
      initialQuery={search || ""}
      initialImportOpen={importYoutube === "1"}
      initialShowBookmarks={bookmarked === "1"}
      key={`${search || ""}:${bookmarked || ""}:${importYoutube || ""}`}
    />
  );
}
