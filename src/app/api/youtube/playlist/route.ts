import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url()
});

function getPlaylistId(url: string) {
  const parsed = new URL(url);
  return parsed.searchParams.get("list");
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

  const apiUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  apiUrl.searchParams.set("part", "snippet,contentDetails");
  apiUrl.searchParams.set("maxResults", "50");
  apiUrl.searchParams.set("playlistId", playlistId);
  apiUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  const [playlistResponse, response] = await Promise.all([
    fetch(playlistApiUrl, { next: { revalidate: 300 } }),
    fetch(apiUrl, { next: { revalidate: 300 } })
  ]);
  if (!response.ok) {
    return NextResponse.json({ error: "YouTube playlist import failed." }, { status: 502 });
  }

  const playlistData = playlistResponse.ok
    ? ((await playlistResponse.json()) as {
        items?: Array<{ snippet?: { title?: string } }>;
      })
    : undefined;

  const data = (await response.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        thumbnails?: { medium?: { url?: string } };
      };
      contentDetails?: { videoId?: string };
    }>;
  };

  const videos =
    data.items
      ?.map((item) => ({
        id: item.contentDetails?.videoId || "",
        title: item.snippet?.title || "Untitled video",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url
      }))
      .filter((video) => video.id) || [];

  return NextResponse.json({
    title: playlistData?.items?.[0]?.snippet?.title || "YouTube Playlist",
    videos,
    urls: videos.map((video) => `https://www.youtube.com/watch?v=${video.id}`)
  });
}
