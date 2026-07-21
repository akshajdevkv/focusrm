"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";
import { CalendarDays, Lightbulb } from "lucide-react";

const DAY_COUNT = 182;
const WEEK_COUNT = Math.ceil(DAY_COUNT / 7);
const DAY_MS = 1000 * 60 * 60 * 24;

const studyTips = [
  {
    title: "Use active recall before rewatching",
    body: "Pause after each idea and write what you remember first. Rewatch only to repair the gaps."
  },
  {
    title: "Make the first step tiny",
    body: "Start with a two-minute task: open the playlist, name the goal, and play the first lesson."
  },
  {
    title: "Study in retrieval rounds",
    body: "Watch once, close the video, explain it from memory, then compare your explanation with the source."
  },
  {
    title: "Batch similar lessons together",
    body: "Group related videos into one focus block so your brain does less context switching."
  },
  {
    title: "End with a next-action note",
    body: "Before stopping, leave one clear sentence about where to resume. Tomorrow starts softer."
  },
  {
    title: "Use desirable difficulty",
    body: "Keep the session slightly challenging. Easy review feels good, but effortful recall tends to stick."
  },
  {
    title: "Protect the first ten minutes",
    body: "Do not judge the session early. Attention often warms up after the opening resistance fades."
  }
];

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function buildCommitmentDays() {
  const today = new Date();
  return Array.from({ length: DAY_COUNT }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (DAY_COUNT - 1 - index));
    return date;
  });
}

function commitmentShade(count: number) {
  if (count >= 4) return "border-emerald-700/30 bg-emerald-800 shadow-emerald-900/20";
  if (count === 3) return "border-emerald-600/30 bg-emerald-600 shadow-emerald-800/18";
  if (count === 2) return "border-emerald-500/30 bg-emerald-400 shadow-emerald-700/16";
  if (count === 1) return "border-emerald-300/50 bg-emerald-200 shadow-emerald-500/14";
  return "border-white/72 bg-white/48";
}

function dailyIndex(length: number, offset = 0) {
  const today = new Date();
  const localDay = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() / DAY_MS);
  return (localDay + offset) % length;
}

export function StudyDashboard() {
  const focusSessions = useWorkspaceStore((state) => state.focusSessions);
  const savedPlaylists = useWorkspaceStore((state) => state.savedPlaylists);
  const totalMinutes = focusSessions.reduce((sum, session) => sum + session.minutes, 0);
  const days = buildCommitmentDays();
  const dailyTip = studyTips[dailyIndex(studyTips.length)];
  const sessionsByDay = focusSessions.reduce<Record<string, number>>((counts, session) => {
    const key = dateKey(new Date(session.completedAt));
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return (
    <div className="gloss-page min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <AppSidebar active="Dashboard" />
      <main className="p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="max-w-5xl">
            <p className="text-sm font-bold uppercase text-primary">Dashboard</p>
            <h1 className="gradient-text text-3xl font-black">Study progress</h1>
          </div>
          <div className="grid max-w-5xl gap-4 md:grid-cols-3">
            {[
              ["Focus minutes", totalMinutes.toString()],
              ["Completed sessions", focusSessions.length.toString()],
              ["Saved playlists", savedPlaylists.length.toString()]
            ].map(([label, value]) => (
              <section key={label} className="gloss-panel hover-gradient rounded-lg p-5">
                <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                <p className="mt-3 text-4xl font-black">{value}</p>
              </section>
            ))}
          </div>

          <section className="gloss-panel hover-gradient w-full rounded-lg p-5 lg:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Daily Study Spark</p>
                <h2 className="text-2xl font-black">Today&apos;s study tip</h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#ffe3c9]/72 bg-[#fff6eb]/72 px-3 py-1.5 text-xs font-black text-muted-foreground shadow-sm">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Changes tomorrow
              </span>
            </div>
            <article className="mt-5 rounded-lg border border-[#ffe3c9]/72 bg-gradient-to-br from-amber-300/32 via-orange-200/26 to-[#fff6eb]/70 p-5 shadow-[0_14px_34px_rgba(38,49,99,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(255,122,47,0.11)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#ffe3c9]/72 bg-[#fff6eb]/78 text-primary shadow-sm">
                  <Lightbulb className="h-5 w-5" />
                </span>
                <p className="text-xs font-black uppercase text-primary">Study tip</p>
              </div>
              <h3 className="mt-4 text-xl font-black text-foreground">{dailyTip.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{dailyTip.body}</p>
            </article>
          </section>

          <section className="gloss-panel hover-gradient w-full rounded-lg p-5 lg:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Commitment History</p>
                <h2 className="text-2xl font-black">Pomodoro completions</h2>
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                {DAY_COUNT} day focus streak map
              </p>
            </div>
            <div className="mt-6 rounded-lg border border-[#ffe3c9]/72 bg-[#fff6eb]/62 p-4 shadow-sm">
              <div
                className="grid w-full grid-flow-col grid-rows-7 gap-1.5"
                style={{ gridTemplateColumns: `repeat(${WEEK_COUNT}, minmax(0, 1fr))` }}
              >
                {days.map((day) => {
                  const count = sessionsByDay[dateKey(day)] || 0;
                  return (
                    <div
                      key={dateKey(day)}
                      title={`${formatDate(day)}: ${count} completed`}
                      aria-label={`${formatDate(day)}: ${count} completed Pomodoro sessions`}
                      className={cn(
                        "aspect-square min-h-3 rounded-[4px] border shadow-sm transition hover:scale-110",
                        commitmentShade(count)
                      )}
                    />
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2 text-xs font-bold text-muted-foreground">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((count) => (
                  <span
                    key={count}
                    className={cn("h-3.5 w-3.5 rounded-[3px] border shadow-sm", commitmentShade(count))}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
