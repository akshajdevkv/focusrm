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
      | { error?: { message?: string; errors?: Array<{ reason?: string }> } }
      | null;
    const reason = details?.error?.errors?.[0]?.reason;
    const quotaExceeded = reason === "quotaExceeded" || reason === "dailyLimitExceeded";
    return NextResponse.json(
      {
        code: quotaExceeded ? "YOUTUBE_QUOTA_EXCEEDED" : "YOUTUBE_SEARCH_FAILED",
        error: quotaExceeded
          ? "YouTube's daily API quota is exhausted. Search will return after the quota resets; you can still paste a playlist URL."
          : details?.error?.message || "YouTube playlist search failed."
      },
      {
        status: quotaExceeded ? 429 : 502,
        headers: quotaExceeded ? { "Retry-After": "3600" } : undefined
      }
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
        thumbnailUrl: bestThumbnail(item.snippet?.thumbnails),
        firstVideoId: "",
        videoCount: 0
      }))
      .filter((playlist) => playlist.id) || [];

  return NextResponse.json(
    { query: parsedQuery.data.q, results: matches },
    { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
  );
}
