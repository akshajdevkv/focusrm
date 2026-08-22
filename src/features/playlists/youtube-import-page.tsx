"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link2, Play, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeYoutubeUrl, youtubePlaylistId, youtubeVideoId } from "@/lib/youtube-url";

export function YoutubeImportPage() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push("/");
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUrl = normalizeYoutubeUrl(youtubeUrl);
    const mediaId = youtubePlaylistId(normalizedUrl) || youtubeVideoId(normalizedUrl);
    if (!normalizedUrl || !mediaId) {
      setError("Paste a valid YouTube video or playlist URL.");
      return;
    }
    router.push(`/learn/${mediaId}`);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f6f8fc] p-4 sm:p-8">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[30rem] w-[30rem] rounded-full bg-violet-200/40 blur-3xl" />
        <div className="gloss-grid absolute inset-0 opacity-30" />
      </div>

      <Link className="absolute left-5 top-5 z-20 inline-flex items-center gap-3 sm:left-8 sm:top-7" href="/">
        <span aria-hidden="true" className="logo-mark grid h-11 w-11 place-items-center rounded-md text-3xl leading-none">F</span>
        <span className="brand-title text-2xl sm:text-3xl">Focus Room</span>
      </Link>

      <div aria-hidden="true" className="absolute inset-0 bg-[#07111f]/48 backdrop-blur-md" />
      <motion.form
        aria-labelledby="youtube-import-title"
        aria-modal="true"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white text-left shadow-[0_32px_100px_rgba(0,0,0,0.34)]"
        onSubmit={handleSubmit}
        role="dialog"
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50">
          <span className="absolute -right-10 -top-16 h-44 w-44 rounded-full border-[28px] border-blue-100/70" />
          <span className="absolute left-20 top-8 h-3 w-3 rounded-full bg-blue-300" />
          <span className="absolute right-32 top-16 h-2 w-2 rounded-full bg-violet-300" />
        </div>
        <div className="relative p-6 sm:p-8">
          <Button asChild aria-label="Return to homepage" className="absolute right-5 top-5 rounded-full border-white/80 bg-white/80 backdrop-blur hover:bg-white" variant="icon">
            <Link href="/"><X className="h-4 w-4" /></Link>
          </Button>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.28)]">
            <Play className="h-6 w-6 fill-current" />
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">No account required</p>
          <h1 className="display-serif mt-2 max-w-md pr-10 text-4xl leading-tight text-neutral-950 sm:text-5xl" id="youtube-import-title">
            What do you want to study?
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-neutral-600">
            Bring any YouTube lesson or full playlist into a focused workspace with notes, progress, and learning tools.
          </p>
          <label className="mt-7 block text-sm font-semibold text-neutral-800" htmlFor="youtube-import-page-url">YouTube link</label>
          <div className="relative mt-2">
            <Link2 aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
            <Input
              aria-describedby={error ? "youtube-import-page-error" : undefined}
              aria-invalid={Boolean(error)}
              autoFocus
              className="h-14 rounded-2xl border-neutral-300 bg-[#f8fafc] pl-12 pr-4 text-base shadow-inner focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              id="youtube-import-page-url"
              onChange={(event) => {
                setYoutubeUrl(event.target.value);
                if (error) setError("");
              }}
              placeholder="Paste a video or playlist URL"
              type="url"
              value={youtubeUrl}
            />
          </div>
          {error ? (
            <p className="mt-2 text-sm font-medium text-red-600" id="youtube-import-page-error" role="alert">{error}</p>
          ) : (
            <p className="mt-2 text-xs leading-5 text-neutral-500">Supports youtube.com, youtu.be, Shorts, live videos, and playlists.</p>
          )}
          <Button className="mt-6 h-14 w-full rounded-2xl text-base shadow-[0_12px_28px_rgba(0,0,0,0.18)]" type="submit">
            Start learning <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Your link is only used to load the study workspace.
          </div>
        </div>
      </motion.form>
    </main>
  );
}
