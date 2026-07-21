"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playCompletionChime } from "@/features/workspace/audio-engine";
import { useWorkspaceStore } from "@/store/workspace-store";
import { TimerMode } from "@/types/focus";
import { cn } from "@/lib/utils";

const modeLabels: Record<TimerMode, string> = {
  focus: "Focus",
  short: "Short",
  long: "Long"
};

export function PomodoroTimer() {
  const mode = useWorkspaceStore((state) => state.mode);
  const durations = useWorkspaceStore((state) => state.durations);
  const autoSwitch = useWorkspaceStore((state) => state.autoSwitch);
  const chime = useWorkspaceStore((state) => state.chime);
  const setMode = useWorkspaceStore((state) => state.setMode);
  const setDuration = useWorkspaceStore((state) => state.setDuration);
  const setAutoSwitch = useWorkspaceStore((state) => state.setAutoSwitch);
  const setChime = useWorkspaceStore((state) => state.setChime);
  const recordFocusSession = useWorkspaceStore(
    (state) => state.recordFocusSession
  );

  const modeSeconds = useMemo(() => durations[mode] * 60, [durations, mode]);
  const [remainingSeconds, setRemainingSeconds] = useState(modeSeconds);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Ready for a focused session.");

  useEffect(() => {
    setRemainingSeconds(modeSeconds);
    setRunning(false);
  }, [modeSeconds]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !running) return;
    setRunning(false);
    setStatus("Session complete.");
    if (mode === "focus") recordFocusSession(durations.focus);
    if (chime) playCompletionChime();
    if (autoSwitch) {
      const nextMode = mode === "focus" ? "short" : "focus";
      window.setTimeout(() => {
        setMode(nextMode);
        setRunning(true);
      }, 900);
    }
  }, [
    autoSwitch,
    chime,
    durations.focus,
    mode,
    recordFocusSession,
    remainingSeconds,
    running,
    setMode
  ]);

  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (remainingSeconds % 60).toString().padStart(2, "0");

  return (
    <section className="grid content-start gap-3 p-5">
      <div className="grid gap-3">
        <div>
          <p className="text-xs font-black uppercase text-primary">
            Now Studying
          </p>
          <h1 className="gradient-text text-2xl font-black leading-tight md:text-3xl">
            Pomodoro Timer
          </h1>
        </div>
        <div className="grid w-full grid-cols-3 rounded-lg border border-[#ffe3c9]/72 bg-[#fff6eb]/70 p-1 shadow-inner">
          {(Object.keys(modeLabels) as TimerMode[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => {
                setMode(candidate);
                setStatus(
                  candidate === "focus"
                    ? "Ready for a focused session."
                    : "Break time. Breathe and reset."
                );
              }}
              className={cn(
                "min-h-9 rounded-md px-2 py-2 text-sm font-bold leading-tight text-muted-foreground transition",
                mode === candidate && "bg-white/90 text-primary shadow-sm"
              )}
            >
              {modeLabels[candidate]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#ffe3c9]/72 bg-[linear-gradient(135deg,rgba(255,246,235,0.88),rgba(255,229,195,0.54),rgba(255,242,226,0.78))] p-4 shadow-sm">
        <div className="grid min-h-28 place-items-center text-center">
          <div>
            <div className="font-mono text-5xl font-black leading-none text-[#0a1531] md:text-6xl">
              {minutes}:{seconds}
            </div>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {status}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <Button
              onClick={() => {
                setRunning((current) => !current);
                setStatus(running ? "Paused." : "Focus session in progress.");
              }}
            >
              {running
                ? "Pause"
                : remainingSeconds === modeSeconds
                  ? "Start"
                  : "Resume"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRunning(false);
                setRemainingSeconds(modeSeconds);
                setStatus("Timer reset.");
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <label className="col-span-2 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <input
                checked={chime}
                type="checkbox"
                onChange={(event) => setChime(event.target.checked)}
              />
              Completion sound
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/70 pt-3">
            {(Object.keys(modeLabels) as TimerMode[]).map((candidate) => (
              <label
                key={candidate}
                className="grid gap-1 text-xs font-bold text-muted-foreground"
              >
                {modeLabels[candidate]}
                <input
                  className="min-h-9 rounded-lg border border-white/70 bg-white/65 px-2 shadow-inner"
                  min={1}
                  max={180}
                  type="number"
                  value={durations[candidate]}
                  onChange={(event) =>
                    setDuration(candidate, Number(event.target.value))
                  }
                />
              </label>
            ))}
            <label className="col-span-2 flex min-h-9 items-center gap-2 text-sm font-bold text-muted-foreground">
              <input
                checked={autoSwitch}
                type="checkbox"
                onChange={(event) => setAutoSwitch(event.target.checked)}
              />
              Auto-switch sessions
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
