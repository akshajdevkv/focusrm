"use client";

import {
  Bird,
  CloudLightning,
  CloudRain,
  Coffee,
  Flame,
  Music2,
  PanelLeftClose,
  PanelLeftOpen,
  LucideIcon,
  Volume2,
  Waves,
  Wind
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  startAmbientSound,
  stopAmbientSound
} from "@/features/workspace/audio-engine";
import { ambientSounds } from "@/features/workspace/sounds";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";

const DEFAULT_SOUND_VOLUME = 58;

const soundIcons: Record<string, LucideIcon> = {
  "Birds Chirping": Bird,
  Breeze: Wind,
  "Smooth Rain": CloudRain,
  "Thunder Lightning": CloudLightning,
  "Coffee Shop Noise": Coffee,
  "Ocean Waves": Waves,
  Fireplace: Flame,
  "Rhythmic Music": Music2
};

export function AmbientSoundsPanel({
  collapsed = false,
  embedded = false,
  onToggleCollapsed
}: {
  collapsed?: boolean;
  embedded?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const sounds = useWorkspaceStore((state) => state.sounds);
  const setSound = useWorkspaceStore((state) => state.setSound);
  const stopAllSounds = useWorkspaceStore((state) => state.stopAllSounds);

  const activeCount = ambientSounds.filter(
    (sound) => sounds[sound.name]?.enabled
  ).length;

  return (
    <aside
      id="sounds-panel"
      className={cn(
        "relative z-10 min-h-0 overflow-hidden rounded-lg bg-[linear-gradient(135deg,rgba(255,246,235,0.88),rgba(255,229,195,0.54),rgba(255,242,226,0.78))] p-5 shadow-sm transition-all duration-300 ease-out",
        embedded
          ? "xl:min-h-[260px]"
          : "mx-4 mt-4 overflow-visible lg:m-0 lg:block lg:h-screen lg:p-3",
        !collapsed && (embedded ? "p-5" : "lg:overflow-y-auto lg:p-5")
      )}
      aria-label="Background sounds"
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          collapsed && "justify-center"
        )}
      >
        <div
          className={cn(
            "transition-all duration-200",
            collapsed && "hidden opacity-0"
          )}
        >
          <p className="text-xs font-black uppercase text-primary">
            Ambient Mixer
          </p>
          <h1 className="text-xl font-black">Background Sounds</h1>
        </div>
        <Button
          className={cn(collapsed && embedded && "h-14 w-14")}
          variant="icon"
          aria-label={
            collapsed
              ? "Expand background sounds panel"
              : "Minimize background sounds panel"
          }
          onClick={onToggleCollapsed}
        >
          {collapsed ? (
            <PanelLeftOpen className={cn("h-4 w-4", embedded && "h-8 w-8")} />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {collapsed ? (
        <div className="mt-8 grid justify-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full border border-white/70 bg-white/64 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_34px_rgba(255,122,47,0.14)]">
            <Volume2 className="h-10 w-10 text-primary" />
          </div>
          <span className="rounded-full bg-white/76 px-3 py-1.5 text-center text-sm font-black text-primary">
            {activeCount}
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "mt-5 flex items-center justify-between gap-3 transition-all duration-200",
          collapsed &&
            "pointer-events-none h-0 translate-x-3 overflow-hidden opacity-0"
        )}
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          {activeCount} active
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            Object.keys(sounds).forEach(stopAmbientSound);
            stopAllSounds();
          }}
        >
          Stop All
        </Button>
      </div>

      <div
        className={cn(
          "mt-4 grid grid-cols-2 justify-items-center gap-x-4 gap-y-5 px-1 pb-1 transition-all duration-300",
          !embedded && "sm:grid-cols-2 lg:grid-cols-1 lg:gap-y-6",
          collapsed &&
            "pointer-events-none h-0 translate-x-4 overflow-hidden opacity-0"
        )}
      >
        {ambientSounds.map((sound) => {
          const config = sounds[sound.name] || {
            enabled: false,
            volume: 40
          };
          const Icon = soundIcons[sound.name] || Volume2;
          return (
            <div
              key={sound.name}
              className="group grid min-h-32 justify-items-center gap-2"
            >
              <button
                type="button"
                aria-label={`Toggle ${sound.name}`}
                aria-pressed={config.enabled}
                onClick={() => {
                  const next = {
                    enabled: !config.enabled,
                    volume: DEFAULT_SOUND_VOLUME
                  };
                  setSound(sound.name, next);
                  if (next.enabled)
                    startAmbientSound(sound.name, sound.audioSrc, next.volume);
                  else stopAmbientSound(sound.name);
                }}
                className={cn(
                  "grid h-[84px] w-[84px] place-items-center rounded-2xl border border-white/70 bg-white/34 p-4 text-orange-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_34px_rgba(255,122,47,0.12)] backdrop-blur-xl transition",
                  "hover:-translate-y-1 hover:border-orange-200 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,221,180,0.38),rgba(255,122,47,0.18))] hover:text-orange-800 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_44px_rgba(255,122,47,0.2)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                  config.enabled &&
                    "border-orange-300/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,209,95,0.42),rgba(255,122,47,0.34))] text-orange-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_18px_46px_rgba(255,122,47,0.28)]"
                )}
              >
                <Icon className="h-8 w-8" />
              </button>
              <span className="pointer-events-none min-h-8 w-24 px-1 text-center text-[11px] font-bold leading-tight text-muted-foreground opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                {sound.name}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
