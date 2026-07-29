"use client";

import { YoutubeStudyPlayer } from "@/features/workspace/youtube-study-player";

export function FocusWorkspace({
  initialYoutubeUrl = ""
}: {
  initialYoutubeUrl?: string;
}) {
  return (
    <div className="gloss-page relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="gloss-grid pointer-events-none absolute inset-0 opacity-55"
      />
      <main className="relative z-10 min-w-0 p-4 lg:p-5 xl:p-6">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-xl bg-white/92 shadow-[0_18px_48px_rgba(0,0,0,0.06)] backdrop-blur-xl">
          <YoutubeStudyPlayer initialYoutubeUrl={initialYoutubeUrl} />
        </div>
      </main>
    </div>
  );
}
