"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpen, Bookmark, CheckCircle2, FileText, ListTree, MousePointer2, Play, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteFooter } from "@/components/site-footer";
import { normalizeLearningQuery } from "@/lib/learning-query";

const titleLetters = Array.from("Focus Room");
const studyTopics = [
  "Python",
  "calculus",
  "graphic design",
  "personal finance",
  "photography",
  "Spanish",
  "music theory",
  "machine learning",
  "public speaking"
];
const features = [
  {
    icon: Play,
    title: "A distraction-free player",
    description: "Watch educational videos without comments, Shorts, suggested videos, or recommendation loops competing for your attention."
  },
  {
    icon: ListTree,
    title: "Playlists become courses",
    description: "Open a YouTube playlist as ordered lessons with real video titles, completion status, and progress across the whole course."
  },
  {
    icon: FileText,
    title: "Transcript and notes",
    description: "Search the video transcript, jump to exact timestamps, and keep timestamped notes beside the lesson."
  },
  {
    icon: Bookmark,
    title: "Save courses for later",
    description: "Bookmark any playlist or video from search or the learning page, then return to everything you saved from one place."
  }
];
const whyFocusRoom = [
  {
    icon: BookOpen,
    title: "Structured like a course",
    description:
      "Turn individual videos and playlists into ordered lessons with clear topics, progress, notes, and opportunities to practise what you learn."
  },
  {
    icon: ShieldCheck,
    title: "Designed for focus",
    description:
      "The learning interface stays deliberate and uncluttered. Extra tools remain out of the way until you choose to open them."
  },
  {
    icon: CheckCircle2,
    title: "Get meaningful work done",
    description:
      "Turn intention into finished lessons with clear next steps, visible progress, and a focused space that helps you follow through."
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export function GlossyLanding({ userName = "" }: { userName?: string }) {
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();
  const liquidY = useTransform(scrollY, [0, 800], [0, 90]);
  const heroContentY = useTransform(scrollY, [0, 650], [0, -44]);
  const geometrySlowY = useTransform(scrollY, [0, 900], [0, 68]);
  const geometryFastY = useTransform(scrollY, [0, 900], [0, 142]);
  const [topicIndex, setTopicIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTopicIndex((current) => (current + 1) % studyTopics.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="home-liquid-page relative min-h-screen overflow-hidden text-black">
      <div className="gloss-grid pointer-events-none fixed inset-0 -z-10 opacity-25" />
      <motion.div
        aria-hidden="true"
        style={{ y: reduceMotion ? 0 : liquidY }}
        className="home-liquid-field pointer-events-none absolute inset-x-0 top-0 z-0 h-[720px]"
      >
        <div className="liquid-sweep liquid-sweep-top" />
        <div className="liquid-sweep liquid-sweep-mid" />
        <div className="liquid-sweep liquid-sweep-low" />
        <motion.div style={{ y: reduceMotion ? 0 : geometrySlowY }} className="hero-ring hero-ring-large" />
        <motion.div style={{ y: reduceMotion ? 0 : geometryFastY }} className="hero-shape hero-shape-square" />
        <motion.div style={{ y: reduceMotion ? 0 : geometrySlowY }} className="hero-shape hero-shape-disc" />
        <motion.div style={{ y: reduceMotion ? 0 : geometryFastY }} className="hero-shape hero-shape-capsule" />
        <motion.div style={{ y: reduceMotion ? 0 : geometrySlowY }} className="hero-shape hero-shape-arc" />
        <motion.div style={{ y: reduceMotion ? 0 : geometryFastY }} className="hero-dot-field" />
      </motion.div>

      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="sticky top-0 z-30 border-b border-black/10 bg-white/90 backdrop-blur-xl"
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link className="inline-flex min-w-0 items-center gap-2 sm:gap-3" href="/">
            <span aria-hidden="true" className="logo-mark grid h-11 w-11 place-items-center rounded-md text-3xl leading-none">
              F
            </span>
            <span className="brand-title inline-flex whitespace-nowrap text-2xl font-normal tracking-tight sm:text-4xl">
              Focus Room
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {!userName ? (
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            ) : null}
            <Button asChild className="shrink-0 px-3 text-sm sm:px-4">
              <Link href="/learn">
                Start studying
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </motion.header>

      <section className="relative z-10 mx-auto flex min-h-[580px] max-w-7xl items-center px-4 py-14 sm:px-6 sm:py-16">
        <motion.div
          style={{ y: reduceMotion ? 0 : heroContentY }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mx-auto w-full max-w-5xl text-center"
        >
          {userName ? (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              className="mb-6 text-sm font-semibold uppercase tracking-[0.16em] text-blue-600"
            >
              Welcome back, {userName}
            </motion.p>
          ) : null}
          <h1 className="max-w-6xl leading-[0.98] tracking-[-0.06em] text-[clamp(3rem,8vw,7.4rem)]">
            <motion.span
              className="typing-title display-serif"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.065, delayChildren: 0.15 } }
              }}
            >
              {titleLetters.map((letter, index) => (
                <motion.span
                  key={`${letter}-${index}`}
                  variants={{
                    hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)" }
                  }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  {letter === " " ? "\u00a0" : letter}
                </motion.span>
              ))}
              <span aria-hidden="true" className="typing-caret" />
            </motion.span>
          </h1>
          <p className="mx-auto mt-8 max-w-3xl text-xl leading-8 text-neutral-600">
            Turn YouTube into your personal learning platform—follow structured courses,
            watch the best educational videos without distractions, and make consistent progress.
          </p>
          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.55, ease: "easeOut" }}
            className="mx-auto mt-12 flex max-w-2xl flex-col items-stretch gap-2 rounded-3xl border border-neutral-300 bg-white p-2 shadow-sm focus-within:border-black focus-within:shadow-md sm:flex-row sm:items-center sm:rounded-full"
            action="/playlists"
            method="get"
            onSubmit={(event) => {
              event.preventDefault();
              const query = normalizeLearningQuery(searchQuery);
              if (query) {
                window.location.assign(`/playlists?search=${encodeURIComponent(query)}`);
              }
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <Input
                aria-label="What do you want to study?"
                className="h-12 border-0 bg-transparent pl-11 pr-2 text-base shadow-none focus:ring-0"
                name="search"
                onChange={(event) => setSearchQuery(event.target.value)}
                type="search"
                value={searchQuery}
              />
              {!searchQuery ? (
                <span className="pointer-events-none absolute inset-y-0 left-11 right-2 flex items-center overflow-hidden text-left text-base text-neutral-400">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={studyTopics[topicIndex]}
                      initial={{ opacity: 0, y: 7, filter: "blur(3px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -7, filter: "blur(3px)" }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="truncate"
                    >
                      I want to learn {studyTopics[topicIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              ) : null}
            </div>
            <Button size="lg" className="h-12 shrink-0 rounded-full px-5" type="submit">
              Search
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>
        </motion.div>
      </section>

      <section id="focus-tools" className="relative mx-auto max-w-7xl px-6 pb-28 pt-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">A better way to learn from video</p>
          <h2 className="display-serif gradient-text mt-5 text-5xl leading-tight md:text-7xl">
            From passive watching to active learning.
          </h2>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ staggerChildren: 0.09 }}
          className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.015 }}
                className="gloss-panel hover-lift hover-gradient rounded-md p-6 [container-type:inline-size]"
              >
                <div className="mb-8 grid h-11 w-11 place-items-center rounded-md bg-black text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="display-serif text-[clamp(1.55rem,10cqw,2.1rem)] leading-[1.08]">{feature.title}</h3>
                <p className="mt-4 leading-7 text-neutral-600">{feature.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <section id="why-focus-room" className="relative mx-auto flex max-w-7xl flex-col px-6 pb-32 pt-10 md:pt-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="order-2 mt-28 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">From videos to courses</p>
            <h2 className="display-serif gradient-text mt-5 pb-4 text-5xl leading-[1.16] md:text-7xl md:leading-[1.14]">
              Learning designed around you.
            </h2>
          </div>
          <p className="max-w-2xl text-xl leading-9 text-neutral-600">
            Focus Room organizes educational videos into structured courses built for understanding,
            progress, and completion. Learn from courses created by people you trust, or build and
            share one of your own.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="order-1 grid overflow-hidden rounded-[2rem] border border-blue-100/70 bg-blue-50/25 shadow-sm lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div className="p-7 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-500">Instantly open any video</p>
            <h3 className="display-serif mt-4 text-4xl leading-tight text-black md:text-5xl">
              One small edit. A better way to watch.
            </h3>
            <p className="mt-5 max-w-lg leading-7 text-neutral-600">
              Place <span className="font-semibold text-black">focusroom.club/</span> before any YouTube URL.
              The video or playlist opens directly in Focus Room&apos;s clean learning workspace.
            </p>
          </div>
          <div className="relative min-h-[280px] overflow-hidden border-t border-blue-100/60 bg-white/70 p-6 lg:border-l lg:border-t-0 md:p-9">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
                <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
              </div>
              <div className="min-w-0 overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-xs md:text-sm">
                <div className="flex min-w-0 items-center">
                  <span className="prefix-typing font-semibold text-blue-600">
                    focusroom.club/
                  </span>
                  <span className="truncate text-neutral-500">youtube.com/watch?v=dQw4w9WgXcQ</span>
                </div>
              </div>
              <motion.div
                animate={{ backgroundColor: ["#f7f7f8", "#f7f7f8", "#eff6ff", "#eff6ff", "#f7f7f8"] }}
                transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.24, 0.36, 0.68, 1] }}
                className="mt-5 inline-flex rounded-full border border-blue-100 px-4 py-2 text-sm font-semibold text-blue-600"
              >
                + focusroom.club/
              </motion.div>
            </div>
            <motion.div
              aria-hidden="true"
              animate={{
                left: ["78%", "38%", "38%", "78%"],
                top: ["78%", "62%", "62%", "78%"],
                scale: [1, 1, 0.86, 1]
              }}
              transition={{ duration: 2.2, repeat: Infinity, times: [0, 0.24, 0.34, 1], ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-20 text-blue-600 drop-shadow-sm"
            >
              <MousePointer2 className="h-8 w-8 fill-blue-100" strokeWidth={2} />
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ staggerChildren: 0.09 }}
          className="order-3 mt-12 grid gap-5 md:grid-cols-3"
        >
          {whyFocusRoom.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                variants={fadeUp}
                whileHover={{ y: -7, scale: 1.01 }}
                className="gloss-panel-subtle rounded-md p-7"
              >
                <div className="mb-7 grid h-11 w-11 place-items-center rounded-md bg-neutral-100 text-black">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-medium text-black">{item.title}</h3>
                <p className="mt-4 leading-7 text-neutral-600">{item.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <SiteFooter showSignIn={!userName} />
    </div>
  );
}
