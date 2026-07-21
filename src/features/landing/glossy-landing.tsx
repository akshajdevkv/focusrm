"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpen, Clock3, Focus, Play, ShieldCheck, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const studyModes = ["Deep Work", "Exam Prep", "Lecture Review", "Reading", "Research"];
const features = [
  {
    icon: Play,
    title: "Distraction-free YouTube",
    description: "Turn playlists into a clean player without comments, trends, or suggested rabbit holes."
  },
  {
    icon: Clock3,
    title: "Built-in Pomodoro",
    description: "Session modes, custom durations, break switching, and completion chimes live above the player."
  },
  {
    icon: Volume2,
    title: "Ambient study layer",
    description: "Mix rain, library ambience, ocean waves, or focus noise directly inside the workspace."
  },
  {
    icon: BookOpen,
    title: "Tasks and progress",
    description: "Keep study tasks beside the video and save focus history for later review."
  }
];
const whyFocusRoom = [
  {
    icon: Focus,
    title: "Built around attention",
    description:
      "Focus Room keeps the learning material, timer, tasks, and ambience together so studying does not require bouncing between noisy tabs."
  },
  {
    icon: ShieldCheck,
    title: "Stay on Track",
    description:
      "Instead of competing with recommendation feeds and comment threads, the workspace centers one lesson at a time and saves your progress."
  },
  {
    icon: BookOpen,
    title: "Made for repeat study sessions",
    description:
      "Playlist tracking, focus history, and simple daily study tips make it feel like a study desk, not another video app."
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

export function GlossyLanding() {
  const { scrollY } = useScroll();
  const liquidY = useTransform(scrollY, [0, 800], [0, 90]);

  return (
    <main className="home-liquid-page relative min-h-screen overflow-hidden text-[#0a1531]">
      <div className="gloss-grid pointer-events-none fixed inset-0 -z-10 opacity-25" />
      <motion.div
        aria-hidden="true"
        style={{ y: liquidY }}
        className="home-liquid-field pointer-events-none absolute inset-x-0 top-0 z-0 h-[720px]"
      >
        <div className="liquid-sweep liquid-sweep-top" />
        <div className="liquid-sweep liquid-sweep-mid" />
        <div className="liquid-sweep liquid-sweep-low" />
      </motion.div>

      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="sticky top-0 z-30 border-b border-[#ffe1c4]/70 bg-[#fff1df]/88"
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link className="inline-flex items-center gap-3" href="/">
            <motion.span
              aria-hidden="true"
              whileHover={{ rotate: -8, y: -2, scale: 1.05 }}
              className="logo-mark grid h-12 w-12 place-items-center rounded-xl text-4xl leading-none text-secondary-foreground"
            >
              F
            </motion.span>
            <span className="brand-title inline-flex text-4xl font-black tracking-tight">
              Focus Room
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="hidden text-[#f07a2b] sm:inline-flex">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/workspace">
                Start studying
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </motion.header>

      <section className="relative z-10 mx-auto min-h-[760px] max-w-7xl px-6 pb-24 pt-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-5xl"
        >
          <h1 className="display-serif max-w-6xl leading-[0.98] tracking-normal text-[clamp(3.8rem,8vw,7.4rem)]">
            <span className="bg-[linear-gradient(105deg,#172d75_0%,#3d2bdb_48%,#ff7a2f_100%)] bg-clip-text text-transparent">
              Study without distractions.
            </span>
          </h1>
          <p className="display-serif mt-8 max-w-3xl text-2xl leading-9 text-[#66708e]">
            Bring YouTube, Pomodoro sessions, ambient sound, and study tasks into
            one glossy workspace built to keep your attention where it belongs.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.55, ease: "easeOut" }}
            className="mt-12 flex flex-wrap gap-4"
          >
            <Button asChild size="lg" className="h-14 px-8 text-lg">
              <Link href="/workspace">
                Open Focus Workspace
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg">
              <Link href="/playlists">Import a playlist</Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-y border-[#ffe3c9]/72 bg-[#fff1df]/68 px-6 py-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ staggerChildren: 0.07 }}
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 text-2xl font-black text-[#17213f]/74"
        >
          {studyModes.map((mode) => (
            <motion.span
              key={mode}
              variants={fadeUp}
              className="bg-[linear-gradient(90deg,#172d75,#5547ff,#ff7a2f)] bg-clip-text text-transparent"
            >
              {mode}
            </motion.span>
          ))}
        </motion.div>
      </section>

      <section id="focus-tools" className="relative mx-auto max-w-7xl px-6 py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <p className="text-lg font-semibold text-[#5738ff]">Focus tools for every learning session</p>
          <h2 className="display-serif gradient-text mt-5 text-5xl leading-tight md:text-7xl">
            A workspace that feels quiet, polished, and alive.
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
                className="gloss-panel hover-lift hover-gradient rounded-lg p-6"
              >
                <div className="mb-8 grid h-12 w-12 place-items-center rounded-lg bg-[linear-gradient(135deg,#5738ff,#ff7a2f)] text-white shadow-lg">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black">{feature.title}</h3>
                <p className="mt-4 leading-7 text-[#66708e]">{feature.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <section id="why-focus-room" className="relative mx-auto max-w-7xl px-6 pb-32 pt-10 md:pt-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end"
        >
          <div>
            <p className="text-lg font-semibold text-[#5738ff]">Why Focus Room?</p>
            <h2 className="display-serif gradient-text mt-5 pb-4 text-5xl leading-[1.16] md:text-7xl md:leading-[1.14]">
              It turns watching into studying.
            </h2>
          </div>
          <p className="max-w-2xl text-xl leading-9 text-[#66708e]">
            Most video platforms are designed to keep you browsing. Focus Room is designed to help you finish:
            import what you want to learn, remove the extra noise, and keep your session tools in one place.
          </p>
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          transition={{ staggerChildren: 0.09 }}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {whyFocusRoom.map((item) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                variants={fadeUp}
                whileHover={{ y: -7, scale: 1.01 }}
                className="gloss-panel-subtle rounded-lg p-7"
              >
                <div className="mb-7 grid h-11 w-11 place-items-center rounded-lg bg-[#ffe1bd]/70 text-[#5738ff] shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black text-[#352446]">{item.title}</h3>
                <p className="mt-4 leading-7 text-[#66708e]">{item.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <footer className="gloss-dark border-t border-white/10 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_auto] md:items-start">
          <div className="max-w-md">
            <Link className="inline-flex items-center gap-3" href="/">
              <span className="logo-mark grid h-11 w-11 place-items-center rounded-lg text-3xl leading-none text-secondary-foreground">
                F
              </span>
              <span className="text-3xl font-black tracking-tight">Focus Room</span>
            </Link>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
              A focused study workspace for playlists, tasks, and timed sessions.
            </p>
          </div>

          <nav className="grid gap-3 text-sm font-bold text-white/70 md:justify-items-end">
            <Link className="transition hover:-translate-y-0.5 hover:text-white" href="/workspace">
              Workspace
            </Link>
            <Link className="transition hover:-translate-y-0.5 hover:text-white" href="/playlists">
              Playlists
            </Link>
            <Link className="transition hover:-translate-y-0.5 hover:text-white" href="/dashboard">
              Dashboard
            </Link>
          </nav>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-sm font-semibold text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; akshajdev 2026</p>
          <div className="flex gap-4">
            <Link className="transition hover:text-white" href="/auth/login">
              Sign in
            </Link>
            <Link className="transition hover:text-white" href="/settings">
              Settings
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
