"use client";

import { YoutubeStudyPlayer } from "@/features/workspace/youtube-study-player";
import { CourseAuditGate } from "@/features/workspace/course-audit-gate";
import { SiteFooter } from "@/components/site-footer";

export function FocusWorkspace({
  initialYoutubeUrl = ""
}: {
  initialYoutubeUrl?: string;
}) {
  return (
    <CourseAuditGate youtubeUrl={initialYoutubeUrl}>
    <div className="gloss-page relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="gloss-grid pointer-events-none absolute inset-0 opacity-55"
      />
      <main className="relative z-10 min-h-screen min-w-0 flex-1 p-0 sm:p-4 lg:p-5 xl:p-6">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-none bg-white/92 shadow-[0_18px_48px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:rounded-xl">
          <YoutubeStudyPlayer initialYoutubeUrl={initialYoutubeUrl} />
        </div>
      </main>
      <SiteFooter />
    </div>
    </CourseAuditGate>
  );
}
