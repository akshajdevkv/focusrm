"use client";

import { useMutation } from "@tanstack/react-query";
import { Play, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PlaylistVideo } from "@/types/focus";

function getPlaylistLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("list") ? "YouTube Playlist" : "YouTube Video";
  } catch {
    return "YouTube Playlist";
  }
}

export function PlaylistImporter() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const savedPlaylists = useWorkspaceStore((state) => state.savedPlaylists);
  const savePlaylist = useWorkspaceStore((state) => state.savePlaylist);
  const playSavedPlaylist = useWorkspaceStore((state) => state.playSavedPlaylist);
  const deleteSavedPlaylist = useWorkspaceStore((state) => state.deleteSavedPlaylist);

  const importPlaylist = useMutation({
    mutationFn: async (playlistUrl: string) => {
      const response = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: playlistUrl })
      });
      const data = (await response.json()) as {
        error?: string;
        title?: string;
        videos?: PlaylistVideo[];
        urls?: string[];
      };
      if (!response.ok) throw new Error(data.error || "Playlist import failed");
      return {
        playlistUrl,
        title: data.title || getPlaylistLabel(playlistUrl),
        videos: data.videos || [],
        urls: data.urls || []
      };
    },
    onSuccess: (data) => {
      const saved = savePlaylist({
        title: data.title,
        sourceUrl: data.playlistUrl,
        urls: data.urls.length ? data.urls : [data.playlistUrl],
        videoCount: data.urls.length || data.videos.length || 1
      });
      setUrl("");
      setMessage(`${saved.title} saved to your playlists.`);
    },
    onError: (_error, playlistUrl) => {
      const saved = savePlaylist({
        title: getPlaylistLabel(playlistUrl),
        sourceUrl: playlistUrl,
        urls: [playlistUrl],
        videoCount: 1
      });
      setUrl("");
      setMessage(`${saved.title} saved. You can watch it now.`);
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (url.trim()) importPlaylist.mutate(url.trim());
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase text-primary">Import Playlist</p>
        <h1 className="text-3xl font-black">Bring in a YouTube playlist</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Save playlists here, then jump into the focus workspace when you are ready
          to watch.
        </p>
      </div>
      <Card className="p-5">
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label className="text-sm font-bold text-muted-foreground" htmlFor="playlist-import">
            Playlist URL
          </label>
          <div className="flex gap-2">
            <Input
              id="playlist-import"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/playlist?list=..."
            />
            <Button disabled={importPlaylist.isPending} type="submit">
              <Save className="h-4 w-4" />
              {importPlaylist.isPending ? "Importing" : "Import"}
            </Button>
          </div>
          {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          {importPlaylist.error ? (
            <p className="text-sm font-semibold text-amber-700">
              Saved in embed mode. It will play in the workspace even without YouTube API metadata.
            </p>
          ) : null}
        </form>
      </Card>

      <div className="grid gap-3">
        <div>
          <p className="text-sm font-bold uppercase text-primary">My Playlists</p>
          <h2 className="text-2xl font-black">Saved for focus sessions</h2>
        </div>
        {savedPlaylists.length === 0 ? (
          <Card className="p-5">
            <p className="font-bold">No saved playlists yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Import a YouTube playlist and it will appear here.
            </p>
          </Card>
        ) : null}
        {savedPlaylists.map((playlist) => (
          <Card
            key={playlist.id}
            className="hover-gradient grid grid-cols-[1fr_auto] items-center gap-4 p-4"
          >
            <div className="min-w-0">
              <p className="truncate font-black">{playlist.title}</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {playlist.videoCount} {playlist.videoCount === 1 ? "video" : "videos"} saved
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{playlist.sourceUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="icon"
                aria-label={`Watch ${playlist.title}`}
                onClick={() => {
                  playSavedPlaylist(playlist.id);
                  router.push("/workspace");
                }}
              >
                <Play className="h-5 w-5" />
              </Button>
              <Button
                variant="icon"
                aria-label={`Delete ${playlist.title}`}
                onClick={() => {
                  deleteSavedPlaylist(playlist.id);
                  setMessage(`${playlist.title} deleted.`);
                }}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
