"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AmbientSoundsPanel } from "@/features/workspace/ambient-sounds-panel";
import { stopAllAmbientSounds } from "@/features/workspace/audio-engine";
import { PomodoroTimer } from "@/features/workspace/pomodoro-timer";
import { StudyTodoList } from "@/features/workspace/study-todo-list";
import { YoutubeStudyPlayer } from "@/features/workspace/youtube-study-player";
import { useWorkspaceStore } from "@/store/workspace-store";

export function FocusWorkspace({
  initialYoutubeUrl = ""
}: {
  initialYoutubeUrl?: string;
}) {
  const [soundsCollapsed, setSoundsCollapsed] = useState(false);
  const stopAllSounds = useWorkspaceStore((state) => state.stopAllSounds);

  useEffect(() => {
    return () => {
      stopAllAmbientSounds();
      stopAllSounds();
    };
  }, [stopAllSounds]);

  return (
    <div className="gloss-page relative min-h-screen overflow-hidden pb-20 transition-[grid-template-columns] duration-300 ease-out lg:grid lg:h-screen lg:grid-cols-[88px_minmax(0,1fr)] lg:pb-0 2xl:grid-cols-[220px_minmax(0,1fr)]">
      <div
        aria-hidden="true"
        className="gloss-grid pointer-events-none absolute inset-0 opacity-55"
      />
      <AppSidebar active="Focus Workspace" compact />
      <main className="relative z-10 min-w-0 overflow-y-auto p-4 lg:p-5 xl:p-6">
        <div className="mx-auto grid max-w-[1180px] overflow-hidden rounded-xl bg-white/92 shadow-[0_18px_48px_rgba(98,86,70,0.08)] backdrop-blur-xl xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid xl:grid-rows-[auto_1fr]">
            <YoutubeStudyPlayer initialYoutubeUrl={initialYoutubeUrl} />
            <StudyTodoList />
          </div>
          <div className="grid">
            <PomodoroTimer />
            <AmbientSoundsPanel
              collapsed={soundsCollapsed}
              embedded
              onToggleCollapsed={() =>
                setSoundsCollapsed((current) => !current)
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
