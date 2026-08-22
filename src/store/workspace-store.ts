"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  AuditedCourse,
  BookmarkedPlaylist,
  CachedTranscript,
  CachedVideoMetadata,
  FocusSession,
  SavedPlaylist,
  Task,
  TimerMode,
  TimestampNote
} from "@/types/focus";

type SoundConfig = {
  enabled: boolean;
  volume: number;
};

type WorkspaceState = {
  hasHydrated: boolean;
  mode: TimerMode;
  durations: Record<TimerMode, number>;
  autoSwitch: boolean;
  chime: boolean;
  sounds: Record<string, SoundConfig>;
  tasks: Task[];
  timestampNotes: TimestampNote[];
  savedPlaylists: SavedPlaylist[];
  focusSessions: FocusSession[];
  playlistUrls: string[];
  playlistIndex: number;
  videoWatchProgress: Record<string, { watchedSeconds: number; duration: number }>;
  learningActivity: Record<string, string[]>;
  videoMetadata: Record<string, CachedVideoMetadata>;
  transcriptCache: Record<string, CachedTranscript>;
  playlistCache: Record<
    string,
    { cachedAt: string; playlist?: BookmarkedPlaylist; urls: string[] }
  >;
  bookmarkedPlaylistIds: string[];
  bookmarkedPlaylists: Record<string, BookmarkedPlaylist>;
  auditedCourses: Record<string, AuditedCourse>;
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
  addTimestampNote: (videoUrl: string, seconds: number, text: string) => void;
  updateTimestampNote: (id: string, text: string) => void;
  deleteTimestampNote: (id: string) => void;
  setPlaylist: (urls: string[]) => void;
  savePlaylist: (playlist: Omit<SavedPlaylist, "id" | "savedAt">) => SavedPlaylist;
  playSavedPlaylist: (id: string) => void;
  deleteSavedPlaylist: (id: string) => void;
  recordFocusSession: (minutes: number) => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setPlaylistIndex: (index: number) => void;
  recordVideoWatch: (url: string, watchedSeconds: number, duration: number) => void;
  cacheVideoMetadata: (
    videos: Array<CachedVideoMetadata & { id: string }>
  ) => void;
  cacheTranscript: (
    videoId: string,
    transcript: Omit<CachedTranscript, "cachedAt">
  ) => void;
  cachePlaylist: (
    playlistId: string,
    urls: string[],
    playlist?: BookmarkedPlaylist
  ) => void;
  togglePlaylistBookmark: (playlist: BookmarkedPlaylist) => void;
  rememberBookmarkedPlaylists: (playlists: BookmarkedPlaylist[]) => void;
  auditCourse: (course: BookmarkedPlaylist) => void;
  removeAuditedCourse: (courseId: string) => void;
  setHasHydrated: (hydrated: boolean) => void;
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
      hasHydrated: false,
      mode: "focus",
      durations: { focus: 25, short: 5, long: 15 },
      autoSwitch: true,
      chime: true,
      sounds: {},
      tasks: starterTasks,
      timestampNotes: [],
      savedPlaylists: [],
      focusSessions: [],
      playlistUrls: [],
      playlistIndex: 0,
      videoWatchProgress: {},
      learningActivity: {},
      videoMetadata: {},
      transcriptCache: {},
      playlistCache: {},
      bookmarkedPlaylistIds: [],
      bookmarkedPlaylists: {},
      auditedCourses: {},
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
      addTimestampNote: (videoUrl, seconds, text) =>
        set((state) => ({
          timestampNotes: [
            ...state.timestampNotes,
            {
              id: createId(),
              videoUrl,
              seconds: Math.max(0, seconds),
              text,
              createdAt: new Date().toISOString()
            }
          ]
        })),
      updateTimestampNote: (id, text) =>
        set((state) => ({
          timestampNotes: state.timestampNotes.map((note) =>
            note.id === id ? { ...note, text } : note
          )
        })),
      deleteTimestampNote: (id) =>
        set((state) => ({
          timestampNotes: state.timestampNotes.filter((note) => note.id !== id)
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
        })),
      setPlaylistIndex: (index) =>
        set((state) => ({
          playlistIndex: Math.max(0, Math.min(state.playlistUrls.length - 1, index))
        })),
      recordVideoWatch: (url, watchedSeconds, duration) =>
        set((state) => {
          const previous = state.videoWatchProgress[url];
          const nextDuration = Math.max(duration, previous?.duration || 0);
          const now = new Date();
          const dateKey = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
          ].join("-");
          const madeProgress = watchedSeconds > (previous?.watchedSeconds || 0);
          const activeVideos = state.learningActivity[dateKey] || [];
          return {
            videoWatchProgress: {
              ...state.videoWatchProgress,
              [url]: {
                duration: nextDuration,
                watchedSeconds: Math.max(
                  previous?.watchedSeconds || 0,
                  Math.min(nextDuration, Math.max(0, watchedSeconds))
                )
              }
            },
            learningActivity: madeProgress
              ? {
                  ...state.learningActivity,
                  [dateKey]: activeVideos.includes(url)
                    ? activeVideos
                    : [...activeVideos, url]
                }
              : state.learningActivity
          };
        }),
      cacheVideoMetadata: (videos) =>
        set((state) => ({
          videoMetadata: videos.reduce(
            (metadata, video) => ({
              ...metadata,
              [video.id]: {
                ...metadata[video.id],
                title: video.title || metadata[video.id]?.title || "",
                ...(video.description !== undefined
                  ? { description: video.description }
                  : {}),
                ...(video.creator !== undefined ? { creator: video.creator } : {}),
                ...(video.thumbnailUrl !== undefined
                  ? { thumbnailUrl: video.thumbnailUrl }
                  : {})
              }
            }),
            { ...state.videoMetadata }
          )
        })),
      cacheTranscript: (videoId, transcript) =>
        set((state) => {
          const entries = Object.entries({
            ...state.transcriptCache,
            [videoId]: { ...transcript, cachedAt: new Date().toISOString() }
          }).sort(
            ([, left], [, right]) => Date.parse(right.cachedAt) - Date.parse(left.cachedAt)
          );
          return { transcriptCache: Object.fromEntries(entries.slice(0, 10)) };
        }),
      cachePlaylist: (playlistId, urls, playlist) =>
        set((state) => ({
          playlistCache: {
            ...state.playlistCache,
            [playlistId]: {
              cachedAt: new Date().toISOString(),
              playlist,
              urls
            }
          }
        })),
      togglePlaylistBookmark: (playlist) =>
        set((state) => {
          const bookmarked = state.bookmarkedPlaylistIds.includes(playlist.id);
          const bookmarkedPlaylists = { ...state.bookmarkedPlaylists };
          if (bookmarked) delete bookmarkedPlaylists[playlist.id];
          else bookmarkedPlaylists[playlist.id] = playlist;
          return {
            bookmarkedPlaylistIds: bookmarked
              ? state.bookmarkedPlaylistIds.filter((id) => id !== playlist.id)
              : [...state.bookmarkedPlaylistIds, playlist.id],
            bookmarkedPlaylists
          };
        }),
      rememberBookmarkedPlaylists: (playlists) =>
        set((state) => ({
          bookmarkedPlaylists: playlists.reduce(
            (bookmarks, playlist) => {
              if (state.bookmarkedPlaylistIds.includes(playlist.id)) {
                bookmarks[playlist.id] = playlist;
              }
              return bookmarks;
            },
            { ...state.bookmarkedPlaylists }
          )
        })),
      auditCourse: (course) =>
        set((state) => ({
          auditedCourses: {
            ...state.auditedCourses,
            [course.id]: {
              ...course,
              auditedAt:
                state.auditedCourses[course.id]?.auditedAt || new Date().toISOString()
            }
          }
        })),
      removeAuditedCourse: (courseId) =>
        set((state) => {
          const auditedCourses = { ...state.auditedCourses };
          delete auditedCourses[courseId];
          return { auditedCourses };
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "focus-room-workspace",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
