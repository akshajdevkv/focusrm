"use client";

import { useMemo } from "react";
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
  onToggleCollapsed
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const sounds = useWorkspaceStore((state) => state.sounds);
  const setSound = useWorkspaceStore((state) => state.setSound);
  const stopAllSounds = useWorkspaceStore((state) => state.stopAllSounds);

  const groupedSounds = useMemo(
    () =>
      ambientSounds.reduce<Record<string, typeof ambientSounds>>((groups, sound) => {
        groups[sound.category] ||= [];
        groups[sound.category].push(sound);
        return groups;
      }, {}),
    []
  );

  const activeCount = ambientSounds.filter((sound) => sounds[sound.name]?.enabled).length;

  return (
    <aside
      id="sounds-panel"
      className={cn(
        "music-glass-panel hover-gradient relative z-10 hidden min-h-0 overflow-hidden border-r p-3 transition-all duration-300 ease-out lg:block",
        !collapsed && "overflow-y-auto p-5"
      )}
      aria-label="Background sounds"
    >
      <div className={cn("flex items-center justify-between gap-3", collapsed && "justify-center")}>
        <div className={cn("transition-all duration-200", collapsed && "hidden opacity-0")}>
          <p className="text-xs font-black uppercase text-primary">Ambient Mixer</p>
          <h1 className="text-xl font-black">Background Sounds</h1>
        </div>
        <Button
          variant="icon"
          aria-label={collapsed ? "Expand background sounds panel" : "Minimize background sounds panel"}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      {collapsed ? (
        <div className="mt-5 grid justify-center gap-3">
          <Volume2 className="h-5 w-5 text-primary" />
          <span className="rounded-full bg-white/70 px-2 py-1 text-center text-xs font-black text-primary">
            {activeCount}
          </span>
        </div>
      ) : null}

      <div className={cn("mt-5 flex items-center justify-between gap-3 transition-all duration-200", collapsed && "pointer-events-none h-0 translate-x-3 overflow-hidden opacity-0")}>
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

      <div className={cn("mt-6 grid gap-6 transition-all duration-300", collapsed && "pointer-events-none translate-x-4 opacity-0")}>
        {Object.entries(groupedSounds).map(([category, categorySounds]) => (
          <section key={category} className="grid gap-3">
            <h2 className="text-xs font-black uppercase text-muted-foreground">{category}</h2>
            <div className="grid grid-cols-3 gap-2">
              {categorySounds.map((sound) => {
                const config = sounds[sound.name] || { enabled: false, volume: 40 };
                const Icon = soundIcons[sound.name] || Volume2;
                return (
                  <button
                    key={sound.name}
                    type="button"
                    aria-label={`Toggle ${sound.name}`}
                    aria-pressed={config.enabled}
                    onClick={() => {
                      const next = { enabled: !config.enabled, volume: DEFAULT_SOUND_VOLUME };
                      setSound(sound.name, next);
                      if (next.enabled) startAmbientSound(sound.name, sound.audioSrc, next.volume);
                      else stopAmbientSound(sound.name);
                    }}
                    className={cn(
                      "group relative grid aspect-square place-items-center rounded-xl border border-white/70 bg-white/34 text-orange-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_14px_34px_rgba(255,122,47,0.12)] backdrop-blur-xl transition",
                      "hover:-translate-y-1 hover:border-orange-200 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.58),rgba(255,221,180,0.38),rgba(255,122,47,0.18))] hover:text-orange-800 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_44px_rgba(255,122,47,0.2)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                      config.enabled &&
                        "border-orange-300/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,209,95,0.42),rgba(255,122,47,0.34))] text-orange-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.86),0_18px_46px_rgba(255,122,47,0.28)]"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg border border-white/70 bg-white/82 px-2.5 py-1 text-xs font-black text-[#632500] opacity-0 shadow-[0_12px_28px_rgba(38,49,99,0.16)] backdrop-blur-xl transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                      {sound.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
