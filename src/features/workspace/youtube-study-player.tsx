"use client";

import { useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  FileText,
  ListTodo,
  NotebookPen,
  PanelRightClose,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { useWorkspaceStore } from "@/store/workspace-store";
import type { BookmarkedPlaylist } from "@/types/focus";

type YoutubeIframePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YoutubeIframeApi = {
  Player: new (
    element: HTMLIFrameElement,
    options: { events?: { onReady?: () => void } }
  ) => YoutubeIframePlayer;
};

declare global {
  interface Window {
    YT?: YoutubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let iframeApiPromise: Promise<YoutubeIframeApi> | null = null;

type TranscriptCue = {
  start: number;
  duration: number;
  text: string;
};

type TranscriptResult = {
  cues: TranscriptCue[];
  sections: TranscriptCue[];
  language: string;
  languageCode: string;
  isGenerated: boolean;
  video?: {
    title: string;
    creator: string;
    creatorUrl: string;
    thumbnailUrl: string;
  };
  summary: { overview: string };
};

function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function playTaskRewardSound() {
  if (typeof window === "undefined" || !window.AudioContext) return;

  const audioContext = new window.AudioContext();
  const notes = [523.25, 659.25, 783.99];
  const startAt = audioContext.currentTime;

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const noteStart = startAt + index * 0.08;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + 0.24);
  });

  window.setTimeout(() => void audioContext.close(), 650);
}

function TranscriptSkeleton({ summary = false }: { summary?: boolean }) {
  if (summary) {
    return (
      <div
        aria-label="Summary loading placeholder"
        className="animate-pulse rounded-2xl border border-neutral-200 bg-white/75 p-5 sm:p-6"
        role="status"
      >
        <div className="h-7 w-3/5 rounded-lg bg-neutral-200" />
        <div className="mt-3 h-4 w-1/4 rounded bg-neutral-200" />
        <div className="mt-6 space-y-3 border-t border-neutral-200 pt-5">
          <div className="h-4 w-full rounded bg-neutral-200" />
          <div className="h-4 w-11/12 rounded bg-neutral-200" />
          <div className="h-4 w-4/5 rounded bg-neutral-200" />
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
        </div>
      </div>
    );
  }

  return (
    <div aria-label="Transcript loading placeholder" className="animate-pulse" role="status">
      <div className="h-11 rounded-xl bg-neutral-100" />
      <div className="mt-5 space-y-4">
        {["w-full", "w-11/12", "w-4/5", "w-full", "w-3/4", "w-11/12"].map(
          (width, index) => (
            <div className="grid grid-cols-[48px_1fr] gap-3" key={`${width}-${index}`}>
              <div className="h-4 rounded bg-blue-100" />
              <div className={`h-4 rounded bg-neutral-200 ${width}`} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

function loadYoutubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise<YoutubeIframeApi>((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return iframeApiPromise;
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
      )}${videoParam}&rel=0&modestbranding=1&autoplay=0&enablejsapi=1`;
    }
    if (!videoId) return "";
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&enablejsapi=1`;
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const youtubePlayerRef = useRef<YoutubeIframePlayer | null>(null);
  const [playerMessage, setPlayerMessage] = useState("");
  const [learningTab, setLearningTab] = useState<"overview" | "summary">("overview");
  const [toolPanel, setToolPanel] = useState<"transcript" | "todo" | "timestamps">("timestamps");
  const [toolPanelOpen, setToolPanelOpen] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [timestampNote, setTimestampNote] = useState("");
  const [transcript, setTranscript] = useState<TranscriptResult>();
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState("");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [currentPlaybackSeconds, setCurrentPlaybackSeconds] = useState(0);
  const playlistUrls = useWorkspaceStore((state) => state.playlistUrls);
  const playlistIndex = useWorkspaceStore((state) => state.playlistIndex);
  const setPlaylist = useWorkspaceStore((state) => state.setPlaylist);
  const setPlaylistIndex = useWorkspaceStore((state) => state.setPlaylistIndex);
  const videoWatchProgress = useWorkspaceStore((state) => state.videoWatchProgress);
  const recordVideoWatch = useWorkspaceStore((state) => state.recordVideoWatch);
  const tasks = useWorkspaceStore((state) => state.tasks);
  const addTask = useWorkspaceStore((state) => state.addTask);
  const updateTask = useWorkspaceStore((state) => state.updateTask);
  const toggleTask = useWorkspaceStore((state) => state.toggleTask);
  const deleteTask = useWorkspaceStore((state) => state.deleteTask);
  const clearCompleted = useWorkspaceStore((state) => state.clearCompleted);
  const timestampNotes = useWorkspaceStore((state) => state.timestampNotes);
  const addTimestampNote = useWorkspaceStore((state) => state.addTimestampNote);
  const updateTimestampNote = useWorkspaceStore((state) => state.updateTimestampNote);
  const deleteTimestampNote = useWorkspaceStore((state) => state.deleteTimestampNote);
  const videoMetadata = useWorkspaceStore((state) => state.videoMetadata);
  const cacheVideoMetadata = useWorkspaceStore((state) => state.cacheVideoMetadata);
  const playlistCache = useWorkspaceStore((state) => state.playlistCache);
  const cachePlaylist = useWorkspaceStore((state) => state.cachePlaylist);
  const bookmarkedPlaylistIds = useWorkspaceStore(
    (state) => state.bookmarkedPlaylistIds
  );
  const bookmarkedPlaylists = useWorkspaceStore(
    (state) => state.bookmarkedPlaylists
  );
  const togglePlaylistBookmark = useWorkspaceStore(
    (state) => state.togglePlaylistBookmark
  );
  const workspaceHydrated = useWorkspaceStore((state) => state.hasHydrated);

  const importPlaylist = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/youtube/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (!response.ok) throw new Error("Unable to import playlist");
      return (await response.json()) as {
        playlist: BookmarkedPlaylist;
        playlistId: string;
        urls: string[];
        videos: Array<{ id: string; title: string; thumbnailUrl?: string }>;
      };
    },
    onSuccess: (data) => {
      cacheVideoMetadata(data.videos || []);
      if (data.urls.length) {
        setPlaylist(data.urls);
        if (data.playlistId) cachePlaylist(data.playlistId, data.urls, data.playlist);
      }
      setPlayerMessage("");
    },
    onError: () => {
      setPlayerMessage("Playing in embed mode.");
    }
  });

  const currentUrl = playlistUrls[playlistIndex] || playlistUrls[0];
  const embedUrl = useMemo(() => youtubeEmbed(currentUrl), [currentUrl]);
  const currentVideoId = useMemo(() => {
    try {
      return currentUrl ? getYoutubeParts(currentUrl).videoId || "" : "";
    } catch {
      return "";
    }
  }, [currentUrl]);
  const courseParts = useMemo(() => {
    try {
      return initialYoutubeUrl
        ? getYoutubeParts(initialYoutubeUrl)
        : { playlistId: null, videoId: null };
    } catch {
      return { playlistId: null, videoId: null };
    }
  }, [initialYoutubeUrl]);
  const courseId = courseParts.playlistId || courseParts.videoId || currentVideoId;
  const firstVideoId = useMemo(() => {
    try {
      return playlistUrls[0] ? getYoutubeParts(playlistUrls[0]).videoId || "" : "";
    } catch {
      return "";
    }
  }, [playlistUrls]);
  const cachedCourse = courseParts.playlistId
    ? playlistCache[courseParts.playlistId]?.playlist
    : undefined;
  const existingCourseBookmark = courseId
    ? bookmarkedPlaylists[courseId]
    : undefined;
  const courseBookmark = useMemo<BookmarkedPlaylist>(() => {
    if (existingCourseBookmark) return existingCourseBookmark;
    if (cachedCourse) return cachedCourse;

    const metadata = videoMetadata[firstVideoId || currentVideoId];
    const video = transcript?.video;
    return {
      id: courseId,
      title:
        metadata?.title ||
        video?.title ||
        (courseParts.playlistId ? "YouTube course" : "YouTube video"),
      description: metadata?.description || "",
      creator: metadata?.creator || video?.creator || "YouTube creator",
      thumbnailUrl: metadata?.thumbnailUrl || video?.thumbnailUrl || "",
      firstVideoId: firstVideoId || currentVideoId,
      videoCount: Math.max(playlistUrls.length, 1)
    };
  }, [
    cachedCourse,
    courseId,
    courseParts.playlistId,
    currentVideoId,
    existingCourseBookmark,
    firstVideoId,
    playlistUrls.length,
    transcript?.video,
    videoMetadata
  ]);
  const courseBookmarked = Boolean(
    courseId && bookmarkedPlaylistIds.includes(courseId)
  );
  const hasVideo = Boolean(currentUrl && embedUrl);

  useEffect(() => {
    if (!workspaceHydrated) return;
    if (!initialYoutubeUrl || loadedSharedUrl.current === initialYoutubeUrl)
      return;

    loadedSharedUrl.current = initialYoutubeUrl;
    setPlaylist([initialYoutubeUrl]);
    setPlayerMessage("");

    if (initialYoutubeUrl.includes("list=")) {
      try {
        const playlistId = getYoutubeParts(initialYoutubeUrl).playlistId;
        const cachedPlaylist = playlistId ? playlistCache[playlistId] : undefined;
        const cacheAge = cachedPlaylist
          ? Date.now() - new Date(cachedPlaylist.cachedAt).getTime()
          : Number.POSITIVE_INFINITY;
        if (cachedPlaylist?.urls.length && cacheAge < 24 * 60 * 60 * 1000) {
          setPlaylist(cachedPlaylist.urls);
          if (cachedPlaylist.playlist) return;
        }
      } catch {
        // Fall through to the server import.
      }
      importPlaylist.mutate(initialYoutubeUrl);
    }
  }, [importPlaylist, initialYoutubeUrl, playlistCache, setPlaylist, workspaceHydrated]);

  useEffect(() => {
    if (!hasVideo || !currentUrl || !iframeRef.current) return;

    let cancelled = false;
    let progressTimer: number | undefined;
    let player: YoutubeIframePlayer | undefined;

    loadYoutubeIframeApi().then((api) => {
      if (cancelled || !iframeRef.current) return;
      player = new api.Player(iframeRef.current, {
        events: {
          onReady: () => {
            progressTimer = window.setInterval(() => {
              if (!player) return;
              const duration = player.getDuration();
              const currentTime = player.getCurrentTime();
              setCurrentPlaybackSeconds(currentTime);
              const playerState = player.getPlayerState();
              if (duration > 0) {
                const reachedCompletion = currentTime / duration >= 0.9 || playerState === 0;
                recordVideoWatch(
                  currentUrl,
                  reachedCompletion ? duration : currentTime,
                  duration
                );
              }
            }, 500);
          }
        }
      });
      youtubePlayerRef.current = player;
    });

    return () => {
      cancelled = true;
      if (progressTimer) window.clearInterval(progressTimer);
      youtubePlayerRef.current = null;
      player?.destroy();
    };
  }, [currentUrl, embedUrl, hasVideo, recordVideoWatch]);

  useEffect(() => {
    if (!currentVideoId) {
      setTranscript(undefined);
      setTranscriptError("Transcript becomes available when an individual video is loaded.");
      return;
    }

    const controller = new AbortController();
    setTranscriptLoading(true);
    setTranscriptError("");
    setTranscriptSearch("");
    setTranscript(undefined);
    fetch(`/api/youtube/transcript?videoId=${encodeURIComponent(currentVideoId)}`, {
      signal: controller.signal
    })
      .then(async (response) => {
        const data = (await response.json()) as TranscriptResult & { error?: string };
        if (!response.ok) throw new Error(data.error || "Transcript is unavailable.");
        setTranscript(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTranscriptError(error instanceof Error ? error.message : "Transcript is unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setTranscriptLoading(false);
      });

    return () => controller.abort();
  }, [currentVideoId]);

  useEffect(() => {
    if (!currentVideoId) return;
    const cachedMetadata = videoMetadata[currentVideoId];
    if (cachedMetadata?.title && cachedMetadata.description !== undefined) return;

    const controller = new AbortController();
    fetch("/api/youtube/metadata", {
      body: JSON.stringify({ videoIds: [currentVideoId] }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Video metadata is unavailable.");
        return (await response.json()) as {
          videos: Array<{ description?: string; id: string; title: string }>;
        };
      })
      .then(({ videos }) => {
        cacheVideoMetadata(videos.filter((video) => video.title));
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });

    return () => controller.abort();
  }, [cacheVideoMetadata, currentVideoId, videoMetadata]);

  const transcriptSections = useMemo(
    () => (transcript?.sections?.length ? transcript.sections : transcript?.cues || []),
    [transcript]
  );

  const visibleTranscriptCues = useMemo(() => {
    const query = transcriptSearch.trim().toLocaleLowerCase();
    if (!query) return transcriptSections;
    return transcriptSections.filter((cue) => cue.text.toLocaleLowerCase().includes(query));
  }, [transcriptSearch, transcriptSections]);

  const activeCueStart = useMemo(() => {
    if (!transcriptSections.length) return -1;
    for (let index = transcriptSections.length - 1; index >= 0; index -= 1) {
      if (transcriptSections[index].start <= currentPlaybackSeconds) {
        return transcriptSections[index].start;
      }
    }
    return -1;
  }, [currentPlaybackSeconds, transcriptSections]);

  const progressPercent = playlistUrls.length
    ? Math.round(
        playlistUrls.reduce((total, url) => {
          const watch = videoWatchProgress[url];
          if (!watch?.duration) return total;
          const watchedPercent = (watch.watchedSeconds / watch.duration) * 100;
          return total + (watchedPercent >= 90 ? 100 : Math.min(99, watchedPercent));
        }, 0) / playlistUrls.length
      )
    : 0;
  const completedVideos = playlistUrls.filter((url) => {
    const watch = videoWatchProgress[url];
    return Boolean(watch?.duration && watch.watchedSeconds / watch.duration >= 0.9);
  }).length;

  const completedTasks = tasks.filter((task) => task.completed).length;
  const currentTimestampNotes = timestampNotes
    .filter((note) => note.videoUrl === currentUrl)
    .sort((left, right) => left.seconds - right.seconds);

  function openToolPanel(panel: typeof toolPanel) {
    if (toolPanel === panel && toolPanelOpen) {
      setToolPanelOpen(false);
      return;
    }
    setToolPanel(panel);
    setToolPanelOpen(true);
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = taskTitle.trim();
    if (!nextTitle) return;
    addTask(nextTitle);
    setTaskTitle("");
  }

  function handleTaskToggle(taskId: string, completed: boolean) {
    toggleTask(taskId);
    if (!completed) playTaskRewardSound();
  }

  function handleTimestampSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = timestampNote.trim();
    if (!text || !currentUrl) return;
    const seconds = youtubePlayerRef.current?.getCurrentTime() || currentPlaybackSeconds;
    addTimestampNote(currentUrl, seconds, text);
    setTimestampNote("");
  }

  return (
    <section className="grid h-full gap-4 px-5 pb-5 pt-0">
      {playerMessage ? (
        <p className="text-sm font-semibold text-neutral-700">{playerMessage}</p>
      ) : null}

      {hasVideo ? (
        <>
          <header className="-mx-5 grid min-h-16 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 border-b border-neutral-200 bg-[#f7f7f8] px-5 py-2.5 sm:gap-3 lg:grid-cols-[auto_minmax(220px,1fr)_auto_auto]" aria-label="Course toolbar">
            <Link
              aria-label="Go to Focus Room home"
              className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              href="/"
            >
              <span aria-hidden="true" className="logo-mark grid h-11 w-11 shrink-0 place-items-center rounded-md text-3xl leading-none">
                F
              </span>
              <span className="brand-title hidden whitespace-nowrap text-3xl font-normal tracking-tight md:inline-flex">
                Focus Room
              </span>
            </Link>

            <form
              action="/playlists"
              className="relative col-span-3 row-start-2 w-full lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:mx-auto lg:max-w-md"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                aria-label="Search for another course"
                className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                name="search"
                placeholder="Search courses"
                type="search"
              />
            </form>

            <div className="col-start-2 row-start-1 flex h-11 items-center gap-3 rounded-full border border-neutral-200 bg-white px-3 shadow-sm sm:px-4 lg:col-start-3">
              <span className="whitespace-nowrap text-xs font-medium text-neutral-600 sm:text-sm">
                {completedVideos}/{playlistUrls.length} <span className="hidden sm:inline">learning items</span>
              </span>
              <div
                aria-label={`${progressPercent}% course progress`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressPercent}
                className="h-2 w-20 overflow-hidden rounded-full bg-blue-100 sm:w-32 lg:w-44"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="hidden min-w-8 text-right text-xs font-semibold text-blue-600 sm:inline">{progressPercent}%</span>
            </div>

            <div className="col-start-3 row-start-1 flex items-center gap-2 lg:col-start-4">
              <button
                aria-label={`${courseBookmarked ? "Remove bookmark from" : "Bookmark"} ${courseBookmark.title}`}
                aria-pressed={courseBookmarked}
                className={`grid h-9 w-9 place-items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  courseBookmarked
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-blue-300 hover:text-blue-600"
                }`}
                disabled={!courseId}
                onClick={() => togglePlaylistBookmark(courseBookmark)}
                type="button"
              >
                <Bookmark className={`h-4 w-4 ${courseBookmarked ? "fill-current" : ""}`} />
              </button>
              <UserProfileMenu compact />
            </div>
          </header>

          <div className="grid overflow-hidden rounded-xl border border-neutral-200 bg-[#f7f7f8] lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="order-2 border-b border-neutral-200 bg-neutral-100/70 lg:order-1 lg:border-b-0 lg:border-r">
              <div className="border-b border-neutral-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Course content</p>
                <h2 className="mt-2 text-lg font-semibold text-neutral-800">
                  {playlistUrls.length === 1 ? "1 lesson" : `${playlistUrls.length} lessons`}
                </h2>
              </div>
              <div className="max-h-[540px] overflow-y-auto p-2">
                {playlistUrls.map((url, index) => {
                  const watch = videoWatchProgress[url];
                  let videoId = "";
                  try {
                    videoId = getYoutubeParts(url).videoId || "";
                  } catch {
                    videoId = "";
                  }
                  const videoTitle =
                    videoMetadata[videoId]?.title ||
                    (videoId === currentVideoId ? transcript?.video?.title : "") ||
                    "Loading title…";
                  const lessonPercent = watch?.duration
                    ? Math.min(100, Math.round((watch.watchedSeconds / watch.duration) * 100))
                    : 0;
                  return (
                    <button
                      key={`${url}-${index}`}
                      className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition ${
                        index === playlistIndex
                          ? "bg-white text-neutral-900 shadow-sm"
                          : lessonPercent >= 90
                            ? "bg-emerald-50/70 text-neutral-700 hover:bg-emerald-50"
                            : "text-neutral-600 hover:bg-white/70"
                      }`}
                      onClick={() => setPlaylistIndex(index)}
                      type="button"
                    >
                      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                        lessonPercent >= 90 ? "bg-emerald-600 text-white" : "border border-neutral-300 bg-white"
                      }`}>
                        {lessonPercent >= 90 ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-neutral-400">Lesson {index + 1}</span>
                        <span className="mt-1 block text-sm font-medium leading-5">{videoTitle}</span>
                        <span className={`mt-1 block text-xs ${lessonPercent >= 90 ? "font-medium text-emerald-700" : "text-neutral-400"}`}>
                          {lessonPercent >= 90 ? "Completed" : `${lessonPercent}% viewed`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="order-1 grid min-w-0 bg-[#f7f7f8] lg:order-2 xl:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
              <div className="aspect-video overflow-hidden bg-[#171717]">
                <iframe
                  key={embedUrl}
                  ref={iframeRef}
                  className="h-full w-full"
                  title="Embedded YouTube study player"
                  src={embedUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="border-b border-neutral-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
                <p
                  className="display-serif text-xl leading-snug text-neutral-900 sm:text-2xl"
                  data-testid="current-video-title"
                  title={videoMetadata[currentVideoId]?.title || transcript?.video?.title}
                >
                  {videoMetadata[currentVideoId]?.title || transcript?.video?.title || "Loading video title…"}
                </p>
              </div>

              <div className="border-b border-neutral-200 px-5 pt-3">
                <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Learning resources">
                  {[
                    ["overview", BookOpen, "Overview"],
                    ["summary", Sparkles, "Summary"]
                  ].map(([tab, Icon, label]) => (
                    <button
                      key={tab as string}
                      aria-selected={learningTab === tab}
                      className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
                        learningTab === tab
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-neutral-500 hover:text-neutral-800"
                      }`}
                      onClick={() => setLearningTab(tab as typeof learningTab)}
                      role="tab"
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      {label as string}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[300px] p-6">
                {learningTab === "overview" ? (
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Current lesson</p>
                    <h3 className="display-serif mt-3 text-3xl leading-tight text-neutral-900">
                      {videoMetadata[currentVideoId]?.title || transcript?.video?.title || "Loading video title…"}
                    </h3>
                    <div className="mt-5 max-h-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white/70 p-5 pr-4">
                      <p
                        className="whitespace-pre-line text-sm leading-7 text-neutral-600"
                        data-testid="current-video-description"
                      >
                        {videoMetadata[currentVideoId]
                          ? videoMetadata[currentVideoId].description ||
                            "No video description was provided by the creator."
                          : "Loading video description…"}
                      </p>
                    </div>
                  </div>
                ) : null}

                {learningTab === "summary" ? (
                  <div className="max-w-3xl">
                    {transcriptLoading || transcriptError ? <TranscriptSkeleton summary /> : null}
                    {transcript ? (
                      <div
                        className="rounded-2xl border border-neutral-200 bg-white/75 p-5 sm:p-6"
                        data-testid="transcript-summary"
                      >
                        {transcript.video ? (
                          <div className="border-b border-neutral-200 pb-5">
                            <p className="display-serif text-3xl leading-tight text-neutral-900">
                              {transcript.video.title}
                            </p>
                            <p className="mt-1.5 text-sm text-neutral-500">
                              By{" "}
                              {transcript.video.creatorUrl ? (
                                <a
                                  className="font-medium text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:text-blue-600"
                                  href={transcript.video.creatorUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {transcript.video.creator || "the video creator"}
                                </a>
                              ) : (
                                transcript.video.creator || "the video creator"
                              )}
                            </p>
                          </div>
                        ) : null}
                        <p className="mt-5 text-base leading-8 text-neutral-700">
                          {transcript.video
                            ? `“${transcript.video.title}” is presented by ${transcript.video.creator || "the video creator"}. `
                            : ""}
                          {transcript.summary.overview || "A summary could not be generated from this transcript."}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

              </div>
              </div>

              <aside
                className={`flex min-h-[620px] justify-end overflow-hidden border-t border-neutral-200 bg-white transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] xl:border-l xl:border-t-0 ${
                  toolPanelOpen ? "xl:w-[448px]" : "xl:w-[88px]"
                }`}
                aria-label="Learning tools"
              >
                  <div
                    aria-hidden={!toolPanelOpen}
                    className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-[width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] xl:flex-none ${
                      toolPanelOpen
                        ? "translate-x-0 opacity-100 xl:w-[360px]"
                        : "pointer-events-none translate-x-5 opacity-0 xl:w-0"
                    }`}
                  >
                    <div className="flex h-[76px] items-center justify-between border-b border-neutral-200 px-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Learning tools</p>
                        <h3 className="display-serif mt-1 text-2xl text-neutral-900">
                          {toolPanel === "transcript"
                            ? "Transcript"
                            : toolPanel === "todo"
                              ? "To-do list"
                              : "Notes"}
                        </h3>
                      </div>
                      <button
                        aria-label="Minimize learning tools"
                        className="grid h-10 w-10 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                        onClick={() => setToolPanelOpen(false)}
                        type="button"
                      >
                        <PanelRightClose className="h-5 w-5" />
                      </button>
                    </div>

                    {toolPanel === "transcript" ? (
                      <div className="min-h-0 flex-1 p-4">
                        {transcriptLoading || transcriptError ? <TranscriptSkeleton /> : null}
                        {transcript ? (
                          <>
                            <label className="flex h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-[#f7f7f8] px-3 text-neutral-400 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
                              <Search className="h-4 w-4 shrink-0" />
                              <input
                                className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
                                onChange={(event) => setTranscriptSearch(event.target.value)}
                                placeholder="Search transcript"
                                type="search"
                                value={transcriptSearch}
                              />
                            </label>
                            <div className="mt-4 max-h-[680px] space-y-1 overflow-y-auto pr-1">
                              {visibleTranscriptCues.map((cue, index) => (
                                <button
                                  key={`${cue.start}-${index}`}
                                  aria-current={cue.start === activeCueStart ? "true" : undefined}
                                  className={`grid w-full grid-cols-[52px_1fr] gap-2 rounded-xl border-l-2 px-3 py-3 text-left text-sm transition ${
                                    cue.start === activeCueStart
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-transparent hover:bg-blue-50/70"
                                  }`}
                                  onClick={() => youtubePlayerRef.current?.seekTo(cue.start, true)}
                                  type="button"
                                >
                                  <span className="font-medium text-blue-600">{formatTimestamp(cue.start)}</span>
                                  <span className="leading-6 text-neutral-600">{cue.text}</span>
                                </button>
                              ))}
                              {!visibleTranscriptCues.length ? (
                                <p className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-sm text-neutral-500">
                                  No transcript lines match “{transcriptSearch}”.
                                </p>
                              ) : null}
                            </div>
                          </>
                        ) : null}
                      </div>
                    ) : toolPanel === "todo" ? (
                      <div className="min-h-0 flex-1 p-4">
                        <form className="flex gap-2" onSubmit={handleTaskSubmit}>
                          <input
                            aria-label="Add a study task"
                            className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-[#f7f7f8] px-3 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            onChange={(event) => setTaskTitle(event.target.value)}
                            placeholder="Add a study task"
                            value={taskTitle}
                          />
                          <button
                            aria-label="Add task"
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                            type="submit"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </form>

                        <div className="mt-4 flex items-center justify-between text-xs font-medium text-neutral-500">
                          <span>{completedTasks} of {tasks.length} complete</span>
                          {completedTasks ? (
                            <button className="text-blue-600 hover:text-blue-700" onClick={clearCompleted} type="button">
                              Clear completed
                            </button>
                          ) : null}
                        </div>

                        <ul className="mt-4 max-h-[680px] space-y-2 overflow-y-auto pr-1">
                          {!tasks.length ? (
                            <li className="rounded-xl border border-dashed border-neutral-200 bg-[#f7f7f8] p-5 text-center text-sm leading-6 text-neutral-500">
                              Add a small next step for this lesson.
                            </li>
                          ) : null}
                          {tasks.map((task) => (
                            <li key={task.id} className="group flex items-center gap-2 rounded-xl border border-neutral-200 bg-[#f7f7f8] p-2.5">
                              <button
                                aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
                                aria-pressed={task.completed}
                                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition ${
                                  task.completed
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-neutral-300 bg-white text-transparent hover:border-blue-400"
                                }`}
                                onClick={() => handleTaskToggle(task.id, task.completed)}
                                type="button"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <input
                                aria-label="Edit task"
                                className={`h-9 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none ${
                                  task.completed ? "text-neutral-400 line-through" : "text-neutral-700"
                                }`}
                                onChange={(event) => updateTask(task.id, event.target.value)}
                                value={task.title}
                              />
                              <button
                                aria-label={`Delete ${task.title}`}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-neutral-400 opacity-0 transition hover:bg-white hover:text-neutral-800 group-hover:opacity-100 focus:opacity-100"
                                onClick={() => deleteTask(task.id)}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="min-h-0 flex-1 p-4">
                        <form className="rounded-xl border border-neutral-200 bg-[#f7f7f8] p-3" onSubmit={handleTimestampSubmit}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                              {formatTimestamp(currentPlaybackSeconds)}
                            </span>
                            <span className="text-xs text-neutral-400">Current video time</span>
                          </div>
                          <textarea
                            aria-label="Timestamped note"
                            className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-neutral-700 outline-none placeholder:text-neutral-400"
                            onChange={(event) => setTimestampNote(event.target.value)}
                            placeholder="What do you want to remember from this moment?"
                            value={timestampNote}
                          />
                          <button
                            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700"
                            type="submit"
                          >
                            <Plus className="h-4 w-4" />
                            Save at {formatTimestamp(currentPlaybackSeconds)}
                          </button>
                        </form>

                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            This video
                          </p>
                          <span className="text-xs text-neutral-400">
                            {currentTimestampNotes.length} {currentTimestampNotes.length === 1 ? "note" : "notes"}
                          </span>
                        </div>

                        <ul className="mt-3 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                          {!currentTimestampNotes.length ? (
                            <li className="rounded-xl border border-dashed border-neutral-200 p-5 text-center text-sm leading-6 text-neutral-500">
                              Play the video, pause at an important moment, and save your first timestamped note.
                            </li>
                          ) : null}
                          {currentTimestampNotes.map((note, index) => (
                            <li key={note.id} className="group rounded-xl border border-neutral-200 bg-blue-50/45 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-medium text-neutral-800">Note {index + 1}</p>
                                <button
                                  className="rounded-lg bg-white px-2.5 py-1 text-sm font-semibold text-blue-600 shadow-sm transition hover:text-blue-800"
                                  onClick={() => youtubePlayerRef.current?.seekTo(note.seconds, true)}
                                  type="button"
                                >
                                  {formatTimestamp(note.seconds)}
                                </button>
                              </div>
                              <textarea
                                aria-label={`Edit note ${index + 1}`}
                                className="mt-3 min-h-24 w-full resize-none bg-transparent text-sm leading-6 text-neutral-700 outline-none"
                                onChange={(event) => updateTimestampNote(note.id, event.target.value)}
                                value={note.text}
                              />
                              <div className="mt-2 flex justify-end">
                                <button
                                  aria-label={`Delete note ${index + 1}`}
                                  className="grid h-9 w-9 place-items-center rounded-lg text-neutral-400 transition hover:bg-white hover:text-neutral-800"
                                  onClick={() => deleteTimestampNote(note.id)}
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                <nav className="flex w-[88px] shrink-0 flex-col border-l border-neutral-200 bg-[#f7f7f8] py-3" aria-label="Learning tool tabs">
                  {[
                    ["transcript", FileText, "Transcript"],
                    ["timestamps", NotebookPen, "Notes"],
                    ["todo", ListTodo, "To-do"]
                  ].map(([panel, Icon, label]) => {
                    const selected = toolPanel === panel && toolPanelOpen;
                    return (
                      <button
                        key={panel as string}
                        aria-expanded={selected}
                        className={`mx-2 flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium transition ${
                          selected
                            ? "bg-blue-50 text-blue-700"
                            : "text-neutral-500 hover:bg-white hover:text-neutral-900"
                        }`}
                        onClick={() => openToolPanel(panel as typeof toolPanel)}
                        type="button"
                      >
                        <Icon className="h-5 w-5" />
                        {label as string}
                      </button>
                    );
                  })}
                </nav>
              </aside>
            </div>
          </div>
        </>
      ) : (
        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center shadow-sm">
          <div className="flex w-full max-w-xl flex-col items-center">
            <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border border-neutral-200 bg-white text-primary shadow-sm">
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
