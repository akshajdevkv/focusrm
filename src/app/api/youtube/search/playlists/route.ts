import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { normalizeLearningQuery } from "@/lib/learning-query";

const searchSchema = z.object({
  q: z.string().trim().min(2).max(120)
});

type ThumbnailSet = {
  default?: { url?: string };
  medium?: { url?: string };
  high?: { url?: string };
  standard?: { url?: string };
  maxres?: { url?: string };
};

function bestThumbnail(thumbnails?: ThumbnailSet) {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    ""
  );
}

export async function GET(request: NextRequest) {
  const parsedQuery = searchSchema.safeParse({
    q: normalizeLearningQuery(request.nextUrl.searchParams.get("q") || "")
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Enter at least two characters to search for playlists." },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing YOUTUBE_API_KEY environment variable." },
      { status: 500 }
    );
  }

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "playlist");
  searchUrl.searchParams.set("order", "relevance");
  searchUrl.searchParams.set("maxResults", "12");
  searchUrl.searchParams.set("safeSearch", "moderate");
  searchUrl.searchParams.set("q", parsedQuery.data.q);
  searchUrl.searchParams.set("key", apiKey);

  const searchResponse = await fetch(searchUrl, { next: { revalidate: 900 } });
  if (!searchResponse.ok) {
    const details = (await searchResponse.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    return NextResponse.json(
      { error: details?.error?.message || "YouTube playlist search failed." },
      { status: searchResponse.status === 403 ? 429 : 502 }
    );
  }

  const searchData = (await searchResponse.json()) as {
    items?: Array<{
      id?: { playlistId?: string };
      snippet?: {
        title?: string;
        description?: string;
        channelTitle?: string;
        thumbnails?: ThumbnailSet;
      };
    }>;
  };

  const matches =
    searchData.items
      ?.map((item) => ({
        id: item.id?.playlistId || "",
        title: item.snippet?.title || "Untitled playlist",
        description: item.snippet?.description || "",
        creator: item.snippet?.channelTitle || "YouTube creator",
        fallbackThumbnailUrl: bestThumbnail(item.snippet?.thumbnails)
      }))
      .filter((playlist) => playlist.id) || [];

  const results = await Promise.all(
    matches.map(async (playlist) => {
      const itemsUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
      itemsUrl.searchParams.set("part", "snippet,contentDetails");
      itemsUrl.searchParams.set("playlistId", playlist.id);
      itemsUrl.searchParams.set("maxResults", "1");
      itemsUrl.searchParams.set("key", apiKey);

      const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/playlists");
      detailsUrl.searchParams.set("part", "contentDetails");
      detailsUrl.searchParams.set("id", playlist.id);
      detailsUrl.searchParams.set("key", apiKey);

      const [itemsResponse, detailsResponse] = await Promise.all([
        fetch(itemsUrl, { next: { revalidate: 900 } }),
        fetch(detailsUrl, { next: { revalidate: 900 } })
      ]);

      const itemsData = itemsResponse.ok
        ? ((await itemsResponse.json()) as {
            items?: Array<{
              snippet?: { thumbnails?: ThumbnailSet };
              contentDetails?: { videoId?: string };
            }>;
          })
        : undefined;
      const detailsData = detailsResponse.ok
        ? ((await detailsResponse.json()) as {
            items?: Array<{ contentDetails?: { itemCount?: number } }>;
          })
        : undefined;
      const firstVideo = itemsData?.items?.[0];

      return {
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        creator: playlist.creator,
        thumbnailUrl:
          bestThumbnail(firstVideo?.snippet?.thumbnails) || playlist.fallbackThumbnailUrl,
        firstVideoId: firstVideo?.contentDetails?.videoId || "",
        videoCount: detailsData?.items?.[0]?.contentDetails?.itemCount || 0
      };
    })
  );

  return NextResponse.json(
    { query: parsedQuery.data.q, results },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
  );
}
