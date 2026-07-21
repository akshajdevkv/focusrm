"use client";

import { useMutation } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/store/workspace-store";

function parseUrls(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getYoutubeParts(url: string) {
  const parsed = new URL(url);
  const pathnameParts = parsed.pathname.split("/").filter(Boolean);
  const host = parsed.hostname.replace(/^www\./, "");
  const playlistId = parsed.searchParams.get("list");
  let videoId = parsed.searchParams.get("v");

  if (!videoId && host === "youtu.be") videoId = pathnameParts[0];
  if (!videoId && ["shorts", "embed", "live"].includes(pathnameParts[0])) {
    videoId = pathnameParts[1];
  }

  return { playlistId, videoId };
}

function youtubeEmbed(url: string) {
  try {
    const { playlistId, videoId } = getYoutubeParts(url);
    if (playlistId) {
      const videoParam = videoId
        ? `&index=1&v=${encodeURIComponent(videoId)}`
        : "";
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(
        playlistId
      )}${videoParam}&rel=0&modestbranding=1&autoplay=0`;
    }
    if (!videoId) return "";
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`;
  } catch {
    return "";
  }
}

export function YoutubeStudyPlayer({
  initialYoutubeUrl = ""
}: {
  initialYoutubeUrl?: string;
}) {
  const loadedSharedUrl = useRef("");
  const [playlistInput, setPlaylistInput] = useState("");
  const [playerMessage, setPlayerMessage] = useState("");
  const playlistUrls = useWorkspaceStore((state) => state.playlistUrls);
  const playlistIndex = useWorkspaceStore((state) => state.playlistIndex);
  const setPlaylist = useWorkspaceStore((state) => state.setPlaylist);
  const previousVideo = useWorkspaceStore((state) => state.previousVideo);
  const nextVideo = useWorkspaceStore((state) => state.nextVideo);

  const importPlaylist = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!response.ok) throw new Error("Unable to import playlist");
      return (await response.json()) as { urls: string[] };
    },
    onSuccess: (data) => {
      if (data.urls.length) setPlaylist(data.urls);
      setPlayerMessage("");
    },
    onError: () => {
      setPlayerMessage("Playing in embed mode.");
    }
  });

  const currentUrl = playlistUrls[playlistIndex] || playlistUrls[0];
  const embedUrl = useMemo(() => youtubeEmbed(currentUrl), [currentUrl]);
  const hasVideo = Boolean(currentUrl && embedUrl);

  useEffect(() => {
    if (!initialYoutubeUrl || loadedSharedUrl.current === initialYoutubeUrl)
      return;

    loadedSharedUrl.current = initialYoutubeUrl;
    setPlaylist([initialYoutubeUrl]);
    setPlayerMessage("");

    if (initialYoutubeUrl.includes("list=")) {
      importPlaylist.mutate(initialYoutubeUrl);
    }
  }, [importPlaylist, initialYoutubeUrl, setPlaylist]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const urls = parseUrls(playlistInput);
    if (!urls.length) return;
    const hasPlaylist = urls[0].includes("list=");
    setPlaylist(urls);
    setPlayerMessage("");
    if (hasPlaylist) importPlaylist.mutate(urls[0]);
    setPlaylistInput("");
  }

  return (
    <section className="grid h-full gap-4 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase text-primary">
            Clean Player
          </p>
          <h2 className="gradient-text text-2xl font-black">Study Playlist</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="icon"
            aria-label="Previous video"
            onClick={previousVideo}
            disabled={!hasVideo}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            aria-label="Next video"
            onClick={nextVideo}
            disabled={!hasVideo}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <form className="grid gap-2" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="playlist-url"
            type="url"
            value={playlistInput}
            onChange={(event) => setPlaylistInput(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <Button
            className="sm:w-28"
            type="submit"
            variant="outline"
            disabled={importPlaylist.isPending}
          >
            {importPlaylist.isPending ? "Importing" : "Load"}
          </Button>
        </div>
        {playerMessage ? (
          <p className="text-sm font-semibold text-amber-700">
            {playerMessage}
          </p>
        ) : null}
      </form>

      {hasVideo ? (
        <>
          <div className="aspect-video overflow-hidden rounded-lg border border-white/70 bg-[#111a18] shadow-[0_24px_60px_rgba(38,49,99,0.18)]">
            <iframe
              className="h-full w-full"
              title="Embedded YouTube study player"
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="grid grid-cols-[auto_1fr] items-center gap-3 text-sm font-semibold text-muted-foreground">
            <span>
              {playlistIndex + 1} of {playlistUrls.length}
            </span>
            <progress
              className="h-2 w-full accent-primary"
              max={playlistUrls.length}
              value={playlistIndex + 1}
            />
          </div>
          <Button asChild variant="outline">
            <a href={currentUrl} target="_blank" rel="noreferrer">
              Open video on YouTube
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </>
      ) : (
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-[#ffe3c9]/72 bg-[linear-gradient(135deg,rgba(255,246,235,0.82),rgba(255,229,195,0.52),rgba(255,242,226,0.78))] p-6 text-center shadow-[0_18px_44px_rgba(38,49,99,0.08)]">
          <div className="flex w-full max-w-xl flex-col items-center">
            <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#ffe3c9]/72 bg-[#fff6eb]/70 text-primary shadow-[0_0_32px_rgba(255,122,47,0.12)]">
              <Play className="ml-0.5 h-7 w-7" />
            </div>
            <div className="mt-7 grid w-full max-w-md justify-items-center gap-3">
              <div className="h-4 w-full rounded-full bg-white/62" />
              <div className="h-4 w-10/12 rounded-full bg-white/48" />
              <div className="h-4 w-7/12 rounded-full bg-white/42" />
            </div>
            <p className="mt-7 max-w-sm text-sm font-bold text-muted-foreground">
              Paste a YouTube video or playlist URL above to start studying.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
