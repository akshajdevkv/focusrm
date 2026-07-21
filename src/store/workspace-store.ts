"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { FocusSession, SavedPlaylist, Task, TimerMode } from "@/types/focus";

type SoundConfig = {
  enabled: boolean;
  volume: number;
};

type WorkspaceState = {
  mode: TimerMode;
  durations: Record<TimerMode, number>;
  autoSwitch: boolean;
  chime: boolean;
  sounds: Record<string, SoundConfig>;
  tasks: Task[];
  savedPlaylists: SavedPlaylist[];
  focusSessions: FocusSession[];
  playlistUrls: string[];
  playlistIndex: number;
  setMode: (mode: TimerMode) => void;
  setDuration: (mode: TimerMode, minutes: number) => void;
  setAutoSwitch: (enabled: boolean) => void;
  setChime: (enabled: boolean) => void;
  setSound: (name: string, config: SoundConfig) => void;
  stopAllSounds: () => void;
  addTask: (title: string) => void;
  updateTask: (id: string, title: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, direction: "up" | "down") => void;
  clearCompleted: () => void;
  setPlaylist: (urls: string[]) => void;
  savePlaylist: (playlist: Omit<SavedPlaylist, "id" | "savedAt">) => SavedPlaylist;
  playSavedPlaylist: (id: string) => void;
  deleteSavedPlaylist: (id: string) => void;
  recordFocusSession: (minutes: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
};

const starterTasks: Task[] = [
  { id: "task-focus-goal", title: "Set a focus goal", completed: false, sortOrder: 0 },
  { id: "task-start-session", title: "Start a 25 minute session", completed: false, sortOrder: 1 }
];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `task-${Date.now()}`;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      mode: "focus",
      durations: { focus: 25, short: 5, long: 15 },
      autoSwitch: true,
      chime: true,
      sounds: {},
      tasks: starterTasks,
      savedPlaylists: [],
      focusSessions: [],
      playlistUrls: [],
      playlistIndex: 0,
      setMode: (mode) => set({ mode }),
      setDuration: (mode, minutes) =>
        set((state) => ({
          durations: { ...state.durations, [mode]: Math.max(1, minutes) }
        })),
      setAutoSwitch: (autoSwitch) => set({ autoSwitch }),
      setChime: (chime) => set({ chime }),
      setSound: (name, config) =>
        set((state) => ({
          sounds: { ...state.sounds, [name]: config }
        })),
      stopAllSounds: () =>
        set((state) => ({
          sounds: Object.fromEntries(
            Object.entries(state.sounds).map(([name, config]) => [
              name,
              { ...config, enabled: false }
            ])
          )
        })),
      addTask: (title) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              id: createId(),
              title,
              completed: false,
              sortOrder: state.tasks.length
            }
          ]
        })),
      updateTask: (id, title) =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, title } : task))
        })),
      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          )
        })),
      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id)
        })),
      moveTask: (id, direction) =>
        set((state) => {
          const tasks = [...state.tasks];
          const index = tasks.findIndex((task) => task.id === id);
          const nextIndex = direction === "up" ? index - 1 : index + 1;
          if (index < 0 || nextIndex < 0 || nextIndex >= tasks.length) return state;
          const [task] = tasks.splice(index, 1);
          tasks.splice(nextIndex, 0, task);
          return { tasks: tasks.map((item, sortOrder) => ({ ...item, sortOrder })) };
        }),
      clearCompleted: () =>
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed)
        })),
      setPlaylist: (playlistUrls) => set({ playlistUrls, playlistIndex: 0 }),
      savePlaylist: (playlist) => {
        const savedPlaylist = {
          ...playlist,
          id: createId(),
          savedAt: new Date().toISOString()
        };
        set((state) => ({
          savedPlaylists: [
            savedPlaylist,
            ...state.savedPlaylists.filter((item) => item.sourceUrl !== playlist.sourceUrl)
          ]
        }));
        return savedPlaylist;
      },
      playSavedPlaylist: (id) =>
        set((state) => {
          const playlist = state.savedPlaylists.find((item) => item.id === id);
          if (!playlist) return state;
          return { playlistUrls: playlist.urls, playlistIndex: 0 };
        }),
      deleteSavedPlaylist: (id) =>
        set((state) => ({
          savedPlaylists: state.savedPlaylists.filter((playlist) => playlist.id !== id)
        })),
      recordFocusSession: (minutes) =>
        set((state) => ({
          focusSessions: [
            {
              id: createId(),
              completedAt: new Date().toISOString(),
              minutes
            },
            ...state.focusSessions
          ]
        })),
      nextVideo: () =>
        set((state) => {
          if (!state.playlistUrls.length) return state;
          return {
            playlistIndex: Math.min(state.playlistUrls.length - 1, state.playlistIndex + 1)
          };
        }),
      previousVideo: () =>
        set((state) => ({
          playlistIndex: Math.max(0, state.playlistIndex - 1)
        }))
    }),
    {
      name: "focus-room-workspace",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
