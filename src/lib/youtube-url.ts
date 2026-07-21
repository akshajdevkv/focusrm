const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com"
]);

type SearchRecord = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function isYoutubeUrl(value: string) {
  try {
    const parsed = new URL(value);
    return YOUTUBE_HOSTS.has(parsed.hostname.replace(/^music\./, ""));
  } catch {
    return false;
  }
}

export function normalizeYoutubeUrl(value: string) {
  const trimmed = value.trim();
  const decoded = trimmed.includes("%") ? decodeURIComponent(trimmed) : trimmed;
  const repairedProtocol = decoded.replace(/^(https?):\/(?!\/)/i, "$1://");
  const withProtocol = /^https?:\/\//i.test(repairedProtocol)
    ? repairedProtocol
    : `https://${repairedProtocol}`;

  return isYoutubeUrl(withProtocol) ? withProtocol : "";
}

export function youtubeUrlFromSearchParams(params: URLSearchParams) {
  for (const key of ["url", "youtube", "u", "video", "playlist"]) {
    const value = params.get(key);
    if (!value) continue;
    const normalized = normalizeYoutubeUrl(value);
    if (normalized) return normalized;
  }

  const videoId = params.get("v");
  const playlistId = params.get("list");
  if (videoId) {
    const url = new URL("https://www.youtube.com/watch");
    url.searchParams.set("v", videoId);
    if (playlistId) url.searchParams.set("list", playlistId);
    return url.toString();
  }
  if (playlistId) {
    const url = new URL("https://www.youtube.com/playlist");
    url.searchParams.set("list", playlistId);
    return url.toString();
  }

  return "";
}

export function youtubeUrlFromSearchRecord(record: SearchRecord) {
  const params = new URLSearchParams();

  Object.entries(record).forEach(([key, value]) => {
    const nextValue = firstValue(value);
    if (nextValue) params.set(key, nextValue);
  });

  return youtubeUrlFromSearchParams(params);
}
