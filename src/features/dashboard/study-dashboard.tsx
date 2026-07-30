"use client";

import { AlertTriangle, ArrowRight, Bookmark, BookOpen, CalendarDays, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { UserProfileMenu } from "@/components/user-profile-menu";
import { BookmarkedPlaylist } from "@/types/focus";
import { useWorkspaceStore } from "@/store/workspace-store";

const ACTIVITY_DAY_COUNT = 182;

function localDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function activityDays() {
  const today = new Date();
  return Array.from({ length: ACTIVITY_DAY_COUNT }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (ACTIVITY_DAY_COUNT - 1 - index));
    return date;
  });
}

function activityShade(count: number) {
  if (count >= 4) return "border-blue-800 bg-blue-800";
  if (count === 3) return "border-blue-600 bg-blue-600";
  if (count === 2) return "border-blue-400 bg-blue-400";
  if (count === 1) return "border-blue-200 bg-blue-200";
  return "border-neutral-200 bg-neutral-100";
}

function LearningActivity({ activity }: { activity: Record<string, string[]> }) {
  const [hoveredDay, setHoveredDay] = useState<{ count: number; label: string } | null>(null);
  const days = activityDays();
  const activeDays = days.filter((date) => (activity[localDateKey(date)]?.length || 0) > 0).length;
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if ((activity[localDateKey(days[index])]?.length || 0) === 0) break;
    streak += 1;
  }

  return (
    <section className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6" aria-labelledby="learning-activity-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
            <CalendarDays className="h-4 w-4" />
            Learning activity
          </p>
          <h2 className="display-serif mt-2 text-3xl text-neutral-900" id="learning-activity-heading">
            Your consistency
          </h2>
        </div>
        <div className="flex gap-6 text-sm">
          <p><span className="block text-xl font-semibold text-neutral-900">{streak}</span><span className="text-neutral-500">day streak</span></p>
          <p><span className="block text-xl font-semibold text-neutral-900">{activeDays}</span><span className="text-neutral-500">active days</span></p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1.5" style={{ gridTemplateColumns: "repeat(26, 0.875rem)" }}>
          {days.map((day) => {
            const key = localDateKey(day);
            const count = activity[key]?.length || 0;
            const label = day.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric"
            });
            return (
              <span
                aria-label={`${day.toLocaleDateString()}: ${count} learning ${count === 1 ? "session" : "sessions"}`}
                className={`h-3.5 w-3.5 rounded-[4px] border transition hover:scale-125 ${activityShade(count)}`}
                key={key}
                onBlur={() => setHoveredDay(null)}
                onFocus={() => setHoveredDay({ count, label })}
                onMouseEnter={() => setHoveredDay({ count, label })}
                onMouseLeave={() => setHoveredDay(null)}
                tabIndex={0}
                title={`${label}: ${count} ${count === 1 ? "video" : "videos"}`}
              />
            );
          })}
        </div>
        <div className="mt-4 flex min-h-5 flex-wrap items-center justify-between gap-3 text-xs font-medium text-neutral-500">
          <p aria-live="polite">
            {hoveredDay
              ? `${hoveredDay.label} · ${hoveredDay.count} ${hoveredDay.count === 1 ? "video studied" : "videos studied"}`
              : "Hover over a day to view its activity"}
          </p>
          <div className="flex items-center gap-2">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((count) => (
              <span className={`h-3.5 w-3.5 rounded-[3px] border ${activityShade(count)}`} key={count} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CourseCard({
  course,
  progress,
  onRemove,
  saved = false
}: {
  course: BookmarkedPlaylist;
  progress: number;
  onRemove?: () => void;
  saved?: boolean;
}) {
  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      {onRemove ? (
        <button
          aria-label={`Remove ${course.title} from My Courses`}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/70 bg-white/95 text-neutral-600 shadow-sm transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          onClick={onRemove}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
      <Link className="flex flex-1 flex-col" href={`/learn/${course.id}`}>
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {course.thumbnailUrl ? (
          <div
            aria-hidden="true"
            className="h-full bg-cover bg-center transition duration-500 group-hover:scale-[1.025]"
            style={{ backgroundImage: `url(${JSON.stringify(course.thumbnailUrl)})` }}
          />
        ) : (
          <div className="grid h-full place-items-center text-neutral-400">
            <BookOpen className="h-10 w-10" />
          </div>
        )}
        {saved ? (
          <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-blue-600 shadow-sm">
            <Bookmark className="h-4 w-4 fill-current" />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="truncate text-sm text-neutral-500">{course.creator}</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-6 text-neutral-900">
          {course.title}
        </h3>
        <p className="mt-2 text-sm text-neutral-500">
          {course.videoCount} {course.videoCount === 1 ? "lesson" : "lessons"}
        </p>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>{progress ? `${progress}% complete` : "Ready to begin"}</span>
            <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-x-1" />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      </Link>
    </article>
  );
}

function EmptyCourses({ bookmarks = false }: { bookmarks?: boolean }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-neutral-300 bg-white/60 px-6 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600">
          {bookmarks ? <Bookmark className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
        </span>
        <p className="mt-4 font-semibold text-neutral-900">
          {bookmarks ? "No bookmarked courses yet" : "No courses yet"}
        </p>
        <Link className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800" href="/playlists">
          Explore courses
        </Link>
      </div>
    </div>
  );
}

export function StudyDashboard({
  userName
}: {
  userName: string;
}) {
  const hasHydrated = useWorkspaceStore((state) => state.hasHydrated);
  const auditedCourses = useWorkspaceStore((state) => state.auditedCourses);
  const bookmarkedPlaylistIds = useWorkspaceStore((state) => state.bookmarkedPlaylistIds);
  const bookmarkedPlaylists = useWorkspaceStore((state) => state.bookmarkedPlaylists);
  const playlistCache = useWorkspaceStore((state) => state.playlistCache);
  const videoWatchProgress = useWorkspaceStore((state) => state.videoWatchProgress);
  const learningActivity = useWorkspaceStore((state) => state.learningActivity);
  const removeAuditedCourse = useWorkspaceStore((state) => state.removeAuditedCourse);
  const [courseToRemove, setCourseToRemove] = useState<BookmarkedPlaylist | null>(null);
  const courses = Object.values(auditedCourses).sort(
    (a, b) => new Date(b.auditedAt).getTime() - new Date(a.auditedAt).getTime()
  );
  const bookmarks = bookmarkedPlaylistIds.flatMap((id) => {
    const course = bookmarkedPlaylists[id] || playlistCache[id]?.playlist;
    return course ? [course] : [];
  });

  function courseProgress(course: BookmarkedPlaylist) {
    const urls = playlistCache[course.id]?.urls ||
      (course.firstVideoId ? [`https://www.youtube.com/watch?v=${course.firstVideoId}`] : []);
    if (!urls.length) return 0;
    const completed = urls.filter((url) => {
      const watch = videoWatchProgress[url];
      return Boolean(watch?.duration && watch.watchedSeconds / watch.duration >= 0.9);
    }).length;
    return Math.round((completed / urls.length) * 100);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f8] text-[#1c1c1c]">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-[#f7f7f8]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link className="inline-flex min-w-0 items-center gap-3" href="/">
            <span className="logo-mark grid h-11 w-11 shrink-0 place-items-center rounded-md text-3xl leading-none">F</span>
            <span className="brand-title hidden whitespace-nowrap text-3xl sm:inline">Focus Room</span>
          </Link>
          <form action="/playlists" className="relative order-3 w-full sm:order-none sm:ml-5 sm:max-w-md sm:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              aria-label="Search courses"
              className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              name="search"
              placeholder="What do you want to learn?"
              type="search"
            />
          </form>
          <div className="ml-auto">
            <UserProfileMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:py-14">
        <section>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Dashboard</p>
            <h1 className="display-serif mt-3 text-4xl leading-tight text-neutral-900 sm:text-5xl">
              Welcome back, {userName}
            </h1>
            <p className="mt-3 text-base text-neutral-500">Continue where you left off and keep learning.</p>
          </div>
        </section>

        {!hasHydrated ? (
          <div className="mt-10 h-72 animate-pulse rounded-2xl bg-neutral-200" />
        ) : (
          <LearningActivity activity={learningActivity} />
        )}

        <section className="mt-12" aria-labelledby="my-courses-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Learning</p>
              <h2 className="display-serif mt-2 text-3xl text-neutral-900" id="my-courses-heading">My courses</h2>
            </div>
            <Link className="text-sm font-semibold text-blue-600 hover:text-blue-800" href="/playlists">Explore courses</Link>
          </div>
          {!hasHydrated ? (
            <div className="h-72 animate-pulse rounded-2xl bg-neutral-200" />
          ) : courses.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  course={course}
                  key={course.id}
                  onRemove={() => setCourseToRemove(course)}
                  progress={courseProgress(course)}
                />
              ))}
            </div>
          ) : <EmptyCourses />}
        </section>

        <section className="mt-14" aria-labelledby="bookmarked-courses-heading">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Saved for later</p>
            <h2 className="display-serif mt-2 text-3xl text-neutral-900" id="bookmarked-courses-heading">Bookmarked courses</h2>
          </div>
          {!hasHydrated ? (
            <div className="h-72 animate-pulse rounded-2xl bg-neutral-200" />
          ) : bookmarks.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {bookmarks.map((course) => (
                <CourseCard course={course} key={course.id} progress={courseProgress(course)} saved />
              ))}
            </div>
          ) : <EmptyCourses bookmarks />}
        </section>
      </main>
      {courseToRemove ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-8 backdrop-blur-sm">
          <section
            aria-labelledby="remove-course-heading"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-8"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <button
                aria-label="Close removal confirmation"
                className="grid h-10 w-10 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                onClick={() => setCourseToRemove(null)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="display-serif mt-5 text-3xl leading-tight text-neutral-900" id="remove-course-heading">
              Remove this course?
            </h2>
            <p className="mt-3 font-medium leading-6 text-neutral-800">{courseToRemove.title}</p>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              It will be removed from My Courses. Your bookmarks and existing watch progress will remain available.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button className="rounded-full" onClick={() => setCourseToRemove(null)} variant="outline">
                Keep course
              </Button>
              <Button
                className="rounded-full bg-red-600 px-6 text-white hover:bg-red-700"
                onClick={() => {
                  removeAuditedCourse(courseToRemove.id);
                  setCourseToRemove(null);
                }}
              >
                Remove course
              </Button>
            </div>
          </section>
        </div>
      ) : null}
      <SiteFooter />
    </div>
  );
}
