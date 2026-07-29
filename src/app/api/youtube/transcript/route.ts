import { NextRequest, NextResponse } from "next/server";
import { execFile } from "node:child_process";
import path from "node:path";
import { z } from "zod";

const querySchema = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/)
});

type TranscriptCue = {
  start: number;
  duration: number;
  text: string;
};

type VideoMetadata = {
  title: string;
  creator: string;
  creatorUrl: string;
  thumbnailUrl: string;
};

type TranscriptPayload = {
  cues: TranscriptCue[];
  sections?: TranscriptCue[];
  language: string;
  languageCode: string;
  isGenerated: boolean;
  summary: { overview: string; keyPoints: string[] };
  video?: VideoMetadata;
};

type TranscriptResult =
  | { payload: TranscriptPayload }
  | { error: string; code: string; status: number };

type TranscriptCacheEntry = {
  expiresAt: number;
  payload: TranscriptPayload;
};

const TRANSCRIPT_CACHE_TTL = 24 * 60 * 60 * 1000;
const globalTranscriptState = globalThis as typeof globalThis & {
  focusRoomTranscriptCache?: Map<string, TranscriptCacheEntry>;
  focusRoomTranscriptRequests?: Map<string, Promise<TranscriptResult>>;
};
const transcriptCache =
  globalTranscriptState.focusRoomTranscriptCache || new Map<string, TranscriptCacheEntry>();
const transcriptRequests =
  globalTranscriptState.focusRoomTranscriptRequests || new Map<string, Promise<TranscriptResult>>();
globalTranscriptState.focusRoomTranscriptCache = transcriptCache;
globalTranscriptState.focusRoomTranscriptRequests = transcriptRequests;

const summaryStopWords = new Set([
  "about", "after", "again", "also", "because", "been", "before", "being",
  "between", "could", "does", "doing", "from", "have", "into", "just",
  "more", "most", "other", "over", "really", "should", "some", "such",
  "than", "that", "their", "them", "then", "there", "these", "they",
  "this", "those", "through", "very", "want", "what", "when", "where",
  "which", "while", "with", "would", "your", "youre"
]);

function transcriptError(code: string): Omit<Extract<TranscriptResult, { error: string }>, "status"> & { status: number } {
  if (["IpBlocked", "RequestBlocked"].includes(code)) {
    return {
      code,
      error: "YouTube temporarily rate-limited transcript requests. Please try again later.",
      status: 503
    };
  }
  return {
    code: code || "TranscriptUnavailable",
    error: "YouTube captions are unavailable for this video.",
    status: 404
  };
}

function fetchWithLocalPython(videoId: string): Promise<TranscriptResult | null> {
  if (process.env.NODE_ENV !== "development") return Promise.resolve(null);

  const executable =
    process.env.PYTHON_TRANSCRIPT_EXECUTABLE ||
    path.join(process.cwd(), ".venv", "bin", "python");
  const script = path.join(process.cwd(), "api", "transcript_cli.py");

  return new Promise<TranscriptResult | null>((resolve) => {
    execFile(
      executable,
      [script, videoId],
      { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024, timeout: 20_000 },
      (_error, stdout) => {
        try {
          const data = JSON.parse(stdout) as TranscriptPayload & { error?: string; code?: string };
          if (data.error) {
            resolve(transcriptError(data.code || "TranscriptUnavailable"));
            return;
          }
          resolve({ payload: data });
        } catch {
          resolve(null);
        }
      }
    );
  });
}

function successResponse(payload: TranscriptPayload, cacheStatus: "HIT" | "MISS") {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "X-Transcript-Cache": cacheStatus
    }
  });
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attribute(tag: string, name: string) {
  return decodeXml(tag.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "");
}

function groupCues(cues: TranscriptCue[], targetDuration = 20) {
  const sections: TranscriptCue[] = [];
  let current: TranscriptCue[] = [];

  cues.forEach((cue) => {
    current.push(cue);
    const start = current[0].start;
    const end = cue.start + cue.duration;
    if (end - start < targetDuration) return;

    sections.push({
      start,
      duration: end - start,
      text: current.map((item) => item.text).join(" ")
    });
    current = [];
  });

  if (current.length) {
    const start = current[0].start;
    const last = current[current.length - 1];
    sections.push({
      start,
      duration: last.start + last.duration - start,
      text: current.map((item) => item.text).join(" ")
    });
  }

  return sections;
}

function summaryWords(text: string) {
  return (text.toLocaleLowerCase().match(/[a-z']{3,}/g) || []).filter(
    (word) => !summaryStopWords.has(word)
  );
}

function transcriptSentences(cues: TranscriptCue[]) {
  const cleaned = cues
    .map((cue) => cue.text)
    .join(" ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[♪♫]/g, " ")
    .replace(/\b([A-Za-z']+)(?:\s+\1\b)+/gi, "$1")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.replace(/^[\s,;:–—-]+/, "").trim())
    .filter((sentence) => /[.!?]$/.test(sentence))
    .filter((sentence) => {
      const words = summaryWords(sentence);
      const fillers = sentence.match(/\b(?:um+|uh+|you know)\b/gi)?.length || 0;
      return words.length >= 8 && words.length <= 45 && fillers <= 2;
    })
    .map((sentence) => sentence.charAt(0).toLocaleUpperCase() + sentence.slice(1));
}

function overlap(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const shared = Array.from(leftSet).filter((word) => rightSet.has(word)).length;
  const total = new Set([...leftSet, ...rightSet]).size;
  return total ? shared / total : 0;
}

function buildSummary(cues: TranscriptCue[], video?: VideoMetadata) {
  const sentences = transcriptSentences(cues);
  if (!sentences.length) return { overview: "", keyPoints: [] as string[] };

  const wordsBySentence = sentences.map(summaryWords);
  const frequencies = new Map<string, number>();
  wordsBySentence.flat().forEach((word) => {
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  });
  summaryWords(video?.title || "").forEach((word) => {
    frequencies.set(word, (frequencies.get(word) || 0) + 4);
  });

  const ranked = wordsBySentence
    .map((words, index) => ({
      index,
      words,
      score:
        Array.from(new Set(words)).reduce(
          (total, word) => total + (frequencies.get(word) || 0),
          0
        ) / Math.sqrt(Math.max(1, words.length))
    }))
    .sort((left, right) => right.score - left.score);
  const selected: typeof ranked = [];
  for (const candidate of ranked) {
    if (selected.every((item) => overlap(item.words, candidate.words) < 0.58)) {
      selected.push(candidate);
    }
    if (selected.length === Math.min(5, sentences.length)) break;
  }

  const overview = selected
    .slice(0, 5)
    .sort((left, right) => left.index - right.index)
    .map((item) => sentences[item.index])
    .join(" ");
  const keyPoints = selected
    .slice(0, 4)
    .sort((left, right) => left.index - right.index)
    .map((item) => sentences[item.index]);

  return { overview, keyPoints };
}

async function fetchVideoMetadata(videoId: string): Promise<VideoMetadata | undefined> {
  try {
    const oembedUrl = new URL("https://www.youtube.com/oembed");
    oembedUrl.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
    oembedUrl.searchParams.set("format", "json");
    const response = await fetch(oembedUrl, { next: { revalidate: 86400 } });
    if (!response.ok) return undefined;

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      author_url?: string;
      thumbnail_url?: string;
    };
    if (!data.title) return undefined;
    return {
      title: data.title,
      creator: data.author_name || "",
      creatorUrl: data.author_url || "",
      thumbnailUrl: data.thumbnail_url || ""
    };
  } catch {
    return undefined;
  }
}

function enrichTranscript(payload: TranscriptPayload, video?: VideoMetadata) {
  const sections = payload.sections?.length ? payload.sections : groupCues(payload.cues);
  return {
    ...payload,
    sections,
    video,
    summary: buildSummary(payload.cues, video)
  };
}

async function fetchLocalFallback(videoId: string) {
  const trackListUrl = new URL("https://www.youtube.com/api/timedtext");
  trackListUrl.searchParams.set("type", "list");
  trackListUrl.searchParams.set("v", videoId);

  const trackResponse = await fetch(trackListUrl, { next: { revalidate: 3600 } });
  if (!trackResponse.ok) return null;

  const tracks = (await trackResponse.text()).match(/<track\b[^>]*\/>/g) || [];
  const selected =
    tracks.find((track) => attribute(track, "lang_code") === "en") ||
    tracks.find((track) => attribute(track, "lang_code").startsWith("en")) ||
    tracks[0];
  if (!selected) return null;

  const transcriptUrl = new URL("https://www.youtube.com/api/timedtext");
  transcriptUrl.searchParams.set("v", videoId);
  transcriptUrl.searchParams.set("lang", attribute(selected, "lang_code"));
  transcriptUrl.searchParams.set("fmt", "json3");
  const name = attribute(selected, "name");
  const kind = attribute(selected, "kind");
  if (name) transcriptUrl.searchParams.set("name", name);
  if (kind) transcriptUrl.searchParams.set("kind", kind);

  const transcriptResponse = await fetch(transcriptUrl, { next: { revalidate: 3600 } });
  if (!transcriptResponse.ok) return null;

  const data = (await transcriptResponse.json()) as {
    events?: Array<{ tStartMs?: number; dDurationMs?: number; segs?: Array<{ utf8?: string }> }>;
  };
  const cues =
    data.events
      ?.map((event) => ({
        start: (event.tStartMs || 0) / 1000,
        duration: (event.dDurationMs || 0) / 1000,
        text: event.segs?.map((segment) => segment.utf8 || "").join("").replace(/\s+/g, " ").trim() || ""
      }))
      .filter((cue) => cue.text) || [];

  if (!cues.length) return null;
  const sections = groupCues(cues);
  return {
    cues,
    sections,
    language: attribute(selected, "lang_translated") || attribute(selected, "lang_code"),
    languageCode: attribute(selected, "lang_code"),
    isGenerated: kind === "asr",
    summary: buildSummary(cues)
  };
}

async function loadTranscript(videoId: string, origin: string): Promise<TranscriptResult> {
  const metadataPromise = fetchVideoMetadata(videoId);

  try {
    const pythonUrl = new URL("/api/youtube_transcript", origin);
    pythonUrl.searchParams.set("videoId", videoId);
    const pythonResponse = await fetch(pythonUrl, { next: { revalidate: 3600 } });
    if (pythonResponse.ok) {
      const payload = (await pythonResponse.json()) as TranscriptPayload;
      return { payload: enrichTranscript(payload, await metadataPromise) };
    }
    const errorPayload = (await pythonResponse.json().catch(() => null)) as {
      error?: string;
      code?: string;
    } | null;
    if (errorPayload?.code) {
      return transcriptError(errorPayload.code);
    }
  } catch {
    // `next dev` does not run Vercel Python functions, so use the local fallback below.
  }

  const localPythonResult = await fetchWithLocalPython(videoId);
  if (localPythonResult) {
    if ("error" in localPythonResult) return localPythonResult;
    return {
      payload: enrichTranscript(localPythonResult.payload, await metadataPromise)
    };
  }

  try {
    const fallback = await fetchLocalFallback(videoId);
    if (fallback) {
      return {
        payload: enrichTranscript(fallback as TranscriptPayload, await metadataPromise)
      };
    }
  } catch {
    // Return a consistent unavailable state below.
  }

  return transcriptError("TranscriptUnavailable");
}

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    videoId: request.nextUrl.searchParams.get("videoId")
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "A valid YouTube video ID is required." }, { status: 400 });
  }

  const videoId = parsed.data.videoId;
  const cached = transcriptCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return successResponse(cached.payload, "HIT");
  }
  if (cached) transcriptCache.delete(videoId);

  let pending = transcriptRequests.get(videoId);
  if (!pending) {
    pending = loadTranscript(videoId, request.nextUrl.origin).finally(() => {
      transcriptRequests.delete(videoId);
    });
    transcriptRequests.set(videoId, pending);
  }

  const result = await pending;
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status, headers: { "Cache-Control": "no-store" } }
    );
  }

  transcriptCache.set(videoId, {
    expiresAt: Date.now() + TRANSCRIPT_CACHE_TTL,
    payload: result.payload
  });
  return successResponse(result.payload, "MISS");
}
