"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Link2,
  ListVideo,
  Search,
  SearchX,
  X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteFooter } from "@/components/site-footer";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { normalizeLearningQuery } from "@/lib/learning-query";
import { normalizeYoutubeUrl, youtubePlaylistId, youtubeVideoId } from "@/lib/youtube-url";
import { useWorkspaceStore } from "@/store/workspace-store";

type PlaylistResult = {
  id: string;
  title: string;
  description: string;
  creator: string;
  thumbnailUrl: string;
  firstVideoId: string;
  videoCount: number;
};

async function searchPlaylists(query: string) {
  const response = await fetch(`/api/youtube/search/playlists?q=${encodeURIComponent(query)}`);
  const data = (await response.json()) as {
    error?: string;
    results?: PlaylistResult[];
  };

  if (!response.ok) throw new Error(data.error || "Playlist search failed.");
  return data.results || [];
}

function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <div className="aspect-video animate-pulse bg-neutral-200" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/5 animate-pulse rounded bg-neutral-200" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

export function PlaylistSearchResults({
  initialQuery,
  initialImportOpen = false,
  initialShowBookmarks = false
}: {
  initialQuery: string;
  initialImportOpen?: boolean;
  initialShowBookmarks?: boolean;
}) {
  const router = useRouter();
  const normalizedInitialQuery = normalizeLearningQuery(initialQuery);
  const [searchInput, setSearchInput] = useState(normalizedInitialQuery);
  const [importOpen, setImportOpen] = useState(initialImportOpen);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [importError, setImportError] = useState("");
  const [showBookmarks, setShowBookmarks] = useState(initialShowBookmarks);
  const [bookmarksReady, setBookmarksReady] = useState(!initialShowBookmarks);
  const query = normalizedInitialQuery;
  const bookmarkedPlaylistIds = useWorkspaceStore(
    (state) => state.bookmarkedPlaylistIds
  );
  const togglePlaylistBookmark = useWorkspaceStore(
    (state) => state.togglePlaylistBookmark
  );
  const bookmarkedPlaylists = useWorkspaceStore(
    (state) => state.bookmarkedPlaylists
  );
  const playlistCache = useWorkspaceStore((state) => state.playlistCache);
  const rememberBookmarkedPlaylists = useWorkspaceStore(
    (state) => state.rememberBookmarkedPlaylists
  );
  const playlists = useQuery({
    queryKey: ["youtube-playlist-search", query],
    queryFn: () => searchPlaylists(query),
    enabled: query.length >= 2,
    staleTime: 15 * 60 * 1000
  });
  const currentBookmarks = bookmarkedPlaylistIds.flatMap((id) => {
    const playlist = bookmarkedPlaylists[id] || playlistCache[id]?.playlist;
    return playlist ? [playlist] : [];
  });
  const visiblePlaylists = showBookmarks
    ? currentBookmarks
    : playlists.data || [];

  useEffect(() => {
    if (playlists.data?.length && bookmarkedPlaylistIds.length) {
      rememberBookmarkedPlaylists(playlists.data);
    }
  }, [
    bookmarkedPlaylistIds.length,
    playlists.data,
    rememberBookmarkedPlaylists
  ]);

  useEffect(() => {
    setShowBookmarks(initialShowBookmarks);
    setSearchInput(normalizedInitialQuery);
    setImportOpen(initialImportOpen);
  }, [initialImportOpen, initialShowBookmarks, normalizedInitialQuery]);

  useEffect(() => {
    let active = true;
    if (!initialShowBookmarks) {
      setBookmarksReady(true);
      return;
    }

    setBookmarksReady(false);
    Promise.resolve(useWorkspaceStore.persist.rehydrate()).finally(() => {
      if (active) setBookmarksReady(true);
    });

    return () => {
      active = false;
    };
  }, [initialShowBookmarks]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = normalizeLearningQuery(searchInput);
    if (nextQuery.length >= 2) {
      window.location.assign(`/playlists?search=${encodeURIComponent(nextQuery)}`);
    }
  }

  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = normalizeYoutubeUrl(youtubeUrl);
    const mediaId = youtubePlaylistId(normalizedUrl) || youtubeVideoId(normalizedUrl);

    if (!normalizedUrl || !mediaId) {
      setImportError("Paste a valid YouTube video or playlist URL.");
      return;
    }

    setImportError("");
    router.push(`/learn/${mediaId}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f8] text-[#1c1c1c]">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-[#f7f7f8]/95 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-[1500px] flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center">
          <Link className="inline-flex shrink-0 items-center gap-3 pr-14 lg:pr-0" href="/">
            <span className="logo-mark grid h-11 w-11 place-items-center rounded-md text-3xl leading-none">F</span>
            <span className="brand-title text-2xl sm:text-3xl">Focus Room</span>
          </Link>
          <div className="w-full lg:ml-12 lg:max-w-3xl">
            <form className="flex w-full items-center gap-2" onSubmit={handleSearch}>
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                <Input
                  aria-label="Search educational playlists"
                  className="h-12 rounded-full border-neutral-300 bg-white pl-12 pr-4 shadow-none"
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="What do you want to learn?"
                  value={searchInput}
                />
              </div>
              <Button className="h-12 rounded-full px-5" type="submit">Search</Button>
              <Button
                aria-expanded={importOpen}
                className="hidden h-12 shrink-0 rounded-full px-5 sm:inline-flex"
                onClick={() => {
                  setImportOpen((open) => !open);
                  setImportError("");
                }}
                type="button"
                variant="outline"
              >
                <Link2 className="h-4 w-4" />
                Import URL
              </Button>
            </form>
            <Button
              aria-expanded={importOpen}
              className="mt-2 h-11 w-full rounded-full sm:hidden"
              onClick={() => {
                setImportOpen((open) => !open);
                setImportError("");
              }}
              type="button"
              variant="outline"
            >
              <Link2 className="h-4 w-4" />
              Import YouTube URL
            </Button>
            {importOpen ? (
              <form className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-lg" onSubmit={handleImport}>
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      aria-describedby={importError ? "youtube-import-error" : undefined}
                      aria-invalid={Boolean(importError)}
                      aria-label="YouTube video or playlist URL"
                      autoFocus
                      className="h-11 pl-10"
                      onChange={(event) => {
                        setYoutubeUrl(event.target.value);
                        if (importError) setImportError("");
                      }}
                      placeholder="Paste a YouTube video or playlist URL"
                      value={youtubeUrl}
                    />
                  </div>
                  <Button className="h-11 shrink-0" type="submit">Open</Button>
                  <Button
                    aria-label="Close import"
                    className="h-11 w-11 shrink-0"
                    onClick={() => {
                      setImportOpen(false);
                      setImportError("");
                    }}
                    type="button"
                    variant="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {importError ? (
                  <p className="mt-2 px-1 text-sm font-medium text-red-600" id="youtube-import-error" role="alert">
                    {importError}
                  </p>
                ) : (
                  <p className="mt-2 px-1 text-xs text-neutral-500">
                    Supports youtube.com, youtu.be, Shorts, videos, and playlists.
                  </p>
                )}
              </form>
            ) : null}
          </div>
          <div className="absolute right-5 top-4 sm:right-8 lg:static lg:ml-auto">
            <UserProfileMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-screen w-full max-w-[1500px] flex-1 px-5 py-10 sm:px-8 lg:py-14">
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
            {showBookmarks ? "Saved courses" : "Structured playlists"}
          </p>
          <h1 className="display-serif mt-3 break-words text-3xl leading-tight [overflow-wrap:anywhere] sm:text-5xl">
            {showBookmarks
              ? "My bookmarks"
              : query
                ? `Courses for “${query}”`
                : "Find your next course"}
          </h1>
          {showBookmarks ? (
            <p className="mt-3 text-lg leading-7 text-neutral-600">
              Return to courses you saved for later.
            </p>
          ) : null}
          {showBookmarks ? (
            <button
              className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
              onClick={() => setShowBookmarks(false)}
              type="button"
            >
              Back to search results
            </button>
          ) : null}
        </div>

        {!showBookmarks && playlists.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => <ResultSkeleton key={index} />)}
          </div>
        ) : null}

        {showBookmarks && !bookmarksReady ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <ResultSkeleton key={index} />)}
          </div>
        ) : null}

        {!showBookmarks && playlists.error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-semibold">We couldn’t load playlist results.</p>
            <p className="mt-1 text-sm">{playlists.error.message}</p>
          </div>
        ) : null}

        {!showBookmarks && query.length < 2 ? (
          <div className="grid min-h-[320px] place-items-center text-center md:min-h-[calc(100vh-25rem)]">
            <div className="max-w-md">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600">
                <BookOpen className="h-7 w-7" />
              </span>
              <h2 className="display-serif mt-5 text-3xl text-neutral-900">No course selected</h2>
              <p className="mt-2 text-base leading-7 text-neutral-500">
                Search for a topic above to discover educational courses and playlists.
              </p>
            </div>
          </div>
        ) : null}

        {visiblePlaylists.length === 0 && bookmarksReady && (
          showBookmarks || (query.length >= 2 && playlists.isSuccess)
        ) ? (
          <div
            className="grid min-h-[320px] place-items-center text-center md:min-h-[calc(100vh-25rem)]"
            data-testid={showBookmarks ? "no-bookmarks" : "no-courses-found"}
          >
            <div className="max-w-md">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-blue-600">
                <SearchX className="h-7 w-7" />
              </span>
              <h2 className="display-serif mt-5 text-3xl text-neutral-900">
                {showBookmarks ? "No bookmarks yet" : "No courses found"}
              </h2>
              <p className="mt-2 text-base leading-7 text-neutral-500">
                {showBookmarks
                  ? "Courses you bookmark will appear here."
                  : "Try another topic or use a broader search."}
              </p>
            </div>
          </div>
        ) : null}

        {visiblePlaylists.length && (!showBookmarks || bookmarksReady) ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visiblePlaylists.map((playlist) => {
              const bookmarked = bookmarkedPlaylistIds.includes(playlist.id);
              return (
              <article
                className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-400 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
                key={playlist.id}
              >
                <button
                  aria-label={`${bookmarked ? "Remove bookmark from" : "Bookmark"} ${playlist.title}`}
                  aria-pressed={bookmarked}
                  className={`absolute bottom-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full border shadow-sm backdrop-blur transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    bookmarked
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-white/70 bg-white/90 text-neutral-700 hover:bg-white"
                  }`}
                  onClick={() => togglePlaylistBookmark(playlist)}
                  type="button"
                >
                  <Bookmark className={`h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
                </button>
                <Link
                  aria-label={`Open ${playlist.title}`}
                  className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                  href={`/learn/${playlist.id}`}
                >
                  <div className="relative aspect-video overflow-hidden bg-neutral-100">
                  {playlist.thumbnailUrl ? (
                    <Image
                      alt=""
                      className="object-cover transition duration-500 group-hover:scale-[1.025]"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      src={playlist.thumbnailUrl}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-neutral-400">
                      <ListVideo className="h-12 w-12" />
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {playlist.videoCount ? `${playlist.videoCount} videos` : "Playlist"}
                  </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                  <p className="truncate text-sm text-neutral-500">{playlist.creator}</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-neutral-900">
                    {playlist.title}
                  </h2>
                  {playlist.description ? (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-neutral-500">
                      {playlist.description}
                    </p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-1.5 pr-12 pt-5 text-sm font-semibold text-blue-600">
                    View course
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  </div>
                </Link>
              </article>
              );
            })}
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
