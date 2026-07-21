"use client";

import { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AmbientSoundsPanel } from "@/features/workspace/ambient-sounds-panel";
import { stopAllAmbientSounds } from "@/features/workspace/audio-engine";
import { PomodoroTimer } from "@/features/workspace/pomodoro-timer";
import { StudyTodoList } from "@/features/workspace/study-todo-list";
import { YoutubeStudyPlayer } from "@/features/workspace/youtube-study-player";
import { useWorkspaceStore } from "@/store/workspace-store";

export function FocusWorkspace({ initialYoutubeUrl = "" }: { initialYoutubeUrl?: string }) {
  const [soundsCollapsed, setSoundsCollapsed] = useState(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);
  const stopAllSounds = useWorkspaceStore((state) => state.stopAllSounds);

  useEffect(() => {
    return () => {
      stopAllAmbientSounds();
      stopAllSounds();
    };
  }, [stopAllSounds]);

  return (
    <div
      className="gloss-page relative min-h-screen overflow-hidden pb-20 transition-[grid-template-columns] duration-300 ease-out lg:grid lg:h-screen lg:grid-cols-[88px_var(--sounds-col)_minmax(500px,1fr)_var(--tasks-col)] lg:pb-0 2xl:grid-cols-[220px_var(--sounds-col)_minmax(560px,1fr)_var(--tasks-col)]"
      style={
        {
          "--sounds-col": soundsCollapsed ? "84px" : "320px",
          "--tasks-col": tasksCollapsed ? "84px" : "380px"
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 -top-40 h-[520px] w-[520px] rounded-full bg-[conic-gradient(from_160deg,#6546ff,#7c5cff,#ff7a2f,#ffd15f,#6546ff)] opacity-35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="gloss-grid pointer-events-none absolute inset-0 opacity-55"
      />
      <AppSidebar active="Focus Workspace" compact />
      <AmbientSoundsPanel
        collapsed={soundsCollapsed}
        onToggleCollapsed={() => setSoundsCollapsed((current) => !current)}
      />
      <main className="relative z-10 min-w-0 overflow-y-auto p-4 lg:p-6">
        <div className="mx-auto grid max-w-5xl gap-5">
          <YoutubeStudyPlayer initialYoutubeUrl={initialYoutubeUrl} />
          <PomodoroTimer />
        </div>
      </main>
      <StudyTodoList
        collapsed={tasksCollapsed}
        onToggleCollapsed={() => setTasksCollapsed((current) => !current)}
      />
    </div>
  );
}
