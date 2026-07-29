import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  videoIds: z.array(z.string().regex(/^[A-Za-z0-9_-]{11}$/)).min(1).max(50)
});

type OEmbedResult = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid YouTube video IDs are required." }, { status: 400 });
  }

  const videoIds = Array.from(new Set(parsed.data.videoIds));

  if (process.env.YOUTUBE_API_KEY) {
    try {
      const apiUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
      apiUrl.searchParams.set("part", "snippet");
      apiUrl.searchParams.set("id", videoIds.join(","));
      apiUrl.searchParams.set("key", process.env.YOUTUBE_API_KEY);
      const response = await fetch(apiUrl, { next: { revalidate: 86400 } });
      if (response.ok) {
        const data = (await response.json()) as {
          items?: Array<{
            id?: string;
            snippet?: {
              channelTitle?: string;
              description?: string;
              thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
              title?: string;
            };
          }>;
        };
        const videos = (data.items || []).map((item) => ({
          creator: item.snippet?.channelTitle || "",
          description: item.snippet?.description || "",
          id: item.id || "",
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || "",
          title: item.snippet?.title || ""
        }));
        if (videos.length) return NextResponse.json({ videos });
      }
    } catch {
      // Fall back to oEmbed metadata below.
    }
  }

  const videos = await Promise.all(
    videoIds.map(async (id) => {
      try {
        const url = new URL("https://www.youtube.com/oembed");
        url.searchParams.set("url", `https://www.youtube.com/watch?v=${id}`);
        url.searchParams.set("format", "json");
        const response = await fetch(url, { next: { revalidate: 86400 } });
        if (!response.ok) return { id, title: "" };
        const data = (await response.json()) as OEmbedResult;
        return {
          id,
          title: data.title || "",
          description: "",
          creator: data.author_name || "",
          thumbnailUrl: data.thumbnail_url || ""
        };
      } catch {
        return { id, title: "" };
      }
    })
  );

  return NextResponse.json({ videos });
}
