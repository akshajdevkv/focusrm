"use client";

import { BookOpen, CheckCircle2, Clock3, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkedPlaylist } from "@/types/focus";
import { youtubePlaylistId, youtubeVideoId } from "@/lib/youtube-url";
import { useWorkspaceStore } from "@/store/workspace-store";

function fallbackCourse(url: string): BookmarkedPlaylist {
  const playlistId = youtubePlaylistId(url);
  const videoId = youtubeVideoId(url);

  return {
    id: playlistId || videoId,
    title: playlistId ? "YouTube course" : "YouTube video",
    description: "",
    creator: "YouTube creator",
    thumbnailUrl: videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : "",
    firstVideoId: videoId,
    videoCount: 1
  };
}

type CourseLoadResult = {
  course: BookmarkedPlaylist;
  durationSeconds?: number;
  urls?: string[];
  videos?: Array<{
    id: string;
    title: string;
    description?: string;
    creator?: string;
    thumbnailUrl?: string;
  }>;
};

async function loadCourse(url: string): Promise<CourseLoadResult> {
  const playlistId = youtubePlaylistId(url);
  const videoId = youtubeVideoId(url);

  if (playlistId) {
    const response = await fetch("/api/youtube/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error("Course details could not be loaded.");
    const data = (await response.json()) as {
      playlist?: BookmarkedPlaylist;
      urls?: string[];
      videos?: CourseLoadResult["videos"];
      totalDurationSeconds?: number;
    };
    if (data.playlist) {
      return {
        course: data.playlist,
        durationSeconds: data.totalDurationSeconds,
        urls: data.urls,
        videos: data.videos
      };
    }
  }

  if (videoId) {
    const response = await fetch("/api/youtube/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIds: [videoId] })
    });
    if (!response.ok) throw new Error("Video details could not be loaded.");
    const data = (await response.json()) as {
      videos?: Array<{
        id: string;
        title: string;
        description?: string;
        creator?: string;
        thumbnailUrl?: string;
        durationSeconds?: number;
      }>;
    };
    const video = data.videos?.[0];
    if (video) {
      return {
        course: {
          id: video.id,
          title: video.title || "YouTube video",
          description: video.description || "",
          creator: video.creator || "YouTube creator",
          thumbnailUrl: video.thumbnailUrl || "",
          firstVideoId: video.id,
          videoCount: 1
        },
        durationSeconds: video.durationSeconds,
        videos: [video]
      };
    }
  }

  return { course: fallbackCourse(url) };
}

export function CourseAuditGate({
  children,
  youtubeUrl
}: {
  children: ReactNode;
  youtubeUrl: string;
}) {
  const router = useRouter();
  const hasHydrated = useWorkspaceStore((state) => state.hasHydrated);
  const auditedCourses = useWorkspaceStore((state) => state.auditedCourses);
  const auditCourse = useWorkspaceStore((state) => state.auditCourse);
  const cachePlaylist = useWorkspaceStore((state) => state.cachePlaylist);
  const cacheVideoMetadata = useWorkspaceStore((state) => state.cacheVideoMetadata);
  const [course, setCourse] = useState<BookmarkedPlaylist>(() =>
    fallbackCourse(youtubeUrl)
  );
  const [loading, setLoading] = useState(true);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const courseId = useMemo(
    () => youtubePlaylistId(youtubeUrl) || youtubeVideoId(youtubeUrl),
    [youtubeUrl]
  );
  const alreadyAuditing = Boolean(courseId && auditedCourses[courseId]);

  function continueToCourse() {
    if (!course.id) return;
    auditCourse(course);
  }

  useEffect(() => {
    if (!hasHydrated || alreadyAuditing) return;
    let active = true;

    setLoading(true);
    loadCourse(youtubeUrl)
      .then((result) => {
        if (!active) return;
        setCourse(result.course);
        setDurationSeconds(
          result.durationSeconds || Math.max(result.course.videoCount, 1) * 15 * 60
        );
        if (result.videos?.length) cacheVideoMetadata(result.videos);
        if (youtubePlaylistId(youtubeUrl) && result.urls?.length) {
          cachePlaylist(result.course.id, result.urls, result.course);
        }
      })
      .catch(() => {
        if (active) {
          setCourse(fallbackCourse(youtubeUrl));
          setDurationSeconds(15 * 60);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    alreadyAuditing,
    cachePlaylist,
    cacheVideoMetadata,
    hasHydrated,
    youtubeUrl
  ]);

  if (!hasHydrated) {
    return <div className="min-h-screen animate-pulse bg-[#f7f7f8]" />;
  }

  if (alreadyAuditing) return children;

  const roundedMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  const durationLabel = hours
    ? `${hours} hr${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} min` : ""}`
    : `${minutes} min`;

  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f7f8] px-4 py-10">
      <section
        aria-labelledby="audit-course-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
        role="dialog"
      >
        {course.thumbnailUrl ? (
          <div
            aria-hidden="true"
            className="aspect-video bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(course.thumbnailUrl)})` }}
          />
        ) : (
          <div className="grid aspect-video place-items-center bg-blue-50 text-blue-600">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                Course access
              </p>
              <h1 className="display-serif mt-3 text-3xl leading-tight text-neutral-900" id="audit-course-title">
                Audit this course?
              </h1>
            </div>
            <button
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              onClick={() => router.push("/playlists")}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 className="mt-6 text-lg font-semibold leading-7 text-neutral-900">
            {loading ? "Loading course details…" : course.title}
          </h2>
          {!loading ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              <p>{course.creator} · {course.videoCount} {course.videoCount === 1 ? "video" : "videos"}</p>
              <p className="inline-flex items-center gap-1.5 font-medium text-neutral-700">
                <Clock3 className="h-4 w-4 text-blue-600" />
                About {durationLabel} to complete
              </p>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              Auditing adds this course to My Courses and saves your learning progress.
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button className="rounded-full" disabled={loading || !course.id} onClick={continueToCourse} variant="outline">
              Not now
            </Button>
            <Button
              className="rounded-full px-6"
              disabled={loading || !course.id}
              onClick={continueToCourse}
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Audit course
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
