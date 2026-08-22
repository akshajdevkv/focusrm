import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url()
});

function getPlaylistId(url: string) {
  const parsed = new URL(url);
  return parsed.searchParams.get("list");
}

function isoDurationSeconds(value = "") {
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return 0;
  return (
    Number(match[1] || 0) * 86400 +
    Number(match[2] || 0) * 3600 +
    Number(match[3] || 0) * 60 +
    Number(match[4] || 0)
  );
}

export async function POST(request: NextRequest) {
  const parsedBody = requestSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "A valid YouTube URL is required." }, { status: 400 });
  }

  const playlistId = getPlaylistId(parsedBody.data.url);
  if (!playlistId) {
    return NextResponse.json({ error: "Playlist URL must include a list id." }, { status: 400 });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "Missing YOUTUBE_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const playlistApiUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
  playlistApiUrl.searchParams.set("part", "snippet");
  playlistApiUrl.searchParams.set("id", playlistId);
  playlistApiUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  type PlaylistItem = {
    snippet?: {
      title?: string;
      thumbnails?: { medium?: { url?: string } };
    };
    contentDetails?: { videoId?: string };
  };

  async function fetchPlaylistItems(id: string) {
    const items: PlaylistItem[] = [];
    let pageToken = "";

    do {
      const apiUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      apiUrl.searchParams.set("part", "snippet,contentDetails");
      apiUrl.searchParams.set("maxResults", "50");
      apiUrl.searchParams.set("playlistId", id);
      apiUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
      if (pageToken) apiUrl.searchParams.set("pageToken", pageToken);

      const response = await fetch(apiUrl, {
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(8_000)
      });
      if (!response.ok) throw new Error("YouTube playlist import failed.");

      const page = (await response.json()) as {
        items?: PlaylistItem[];
        nextPageToken?: string;
      };
      items.push(...(page.items || []));
      pageToken = page.nextPageToken || "";
    } while (pageToken);

    return items;
  }

  const [playlistResponse, importedItems] = await Promise.all([
    fetch(playlistApiUrl, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000)
    }),
    fetchPlaylistItems(playlistId)
  ]).catch(() => [null, null] as const);

  if (!importedItems) {
    return NextResponse.json({ error: "YouTube playlist import failed." }, { status: 502 });
  }

  const playlistData = playlistResponse?.ok
    ? ((await playlistResponse.json()) as {
        items?: Array<{
          snippet?: {
            channelTitle?: string;
            description?: string;
            thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
            title?: string;
          };
        }>;
      })
    : undefined;

  const videos =
    importedItems
      ?.map((item) => ({
        id: item.contentDetails?.videoId || "",
        title: item.snippet?.title || "Untitled video",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url
      }))
      .filter(
        (video) =>
          video.id && video.title !== "Deleted video" && video.title !== "Private video"
      ) || [];

  const playlistSnippet = playlistData?.items?.[0]?.snippet;
  const title = playlistSnippet?.title || "YouTube Playlist";
  const videoIds = videos.map((video) => video.id);
  const durationBatches = Array.from(
    { length: Math.ceil(videoIds.length / 50) },
    (_, index) => videoIds.slice(index * 50, index * 50 + 50)
  );
  const durationResults = await Promise.all(
    durationBatches.map(async (ids) => {
      if (!ids.length) return 0;
      const durationUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      durationUrl.searchParams.set("part", "contentDetails");
      durationUrl.searchParams.set("id", ids.join(","));
      durationUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
      try {
        const response = await fetch(durationUrl, {
          next: { revalidate: 86400 },
          signal: AbortSignal.timeout(8_000)
        });
        if (!response.ok) return 0;
        const data = (await response.json()) as {
          items?: Array<{ contentDetails?: { duration?: string } }>;
        };
        return (data.items || []).reduce(
          (total, item) => total + isoDurationSeconds(item.contentDetails?.duration),
          0
        );
      } catch {
        return 0;
      }
    })
  );
  const totalDurationSeconds = durationResults.reduce((total, value) => total + value, 0);

  return NextResponse.json({
    playlist: {
      id: playlistId,
      title,
      description: playlistSnippet?.description || "",
      creator: playlistSnippet?.channelTitle || "YouTube creator",
      thumbnailUrl:
        playlistSnippet?.thumbnails?.high?.url ||
        playlistSnippet?.thumbnails?.medium?.url ||
        videos[0]?.thumbnailUrl ||
        "",
      firstVideoId: videos[0]?.id || "",
      videoCount: videos.length
    },
    playlistId,
    title,
    totalDurationSeconds,
    videos,
    urls: videos.map((video) => `https://www.youtube.com/watch?v=${video.id}`)
  });
}
