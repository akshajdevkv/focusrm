export type TimerMode = "focus" | "short" | "long";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
};

export type TimestampNote = {
  id: string;
  videoUrl: string;
  seconds: number;
  text: string;
  createdAt: string;
};

export type AmbientSound = {
  category: "Nature" | "Weather" | "Ambience" | "Music";
  name: string;
  tone: SoundTone;
  audioSrc: string;
};

export type SoundTone =
  | "birds"
  | "breeze"
  | "smooth-rain"
  | "thunder-lightning"
  | "coffee-shop"
  | "waves"
  | "fireplace"
  | "rhythm";

export type PlaylistVideo = {
  id: string;
  title: string;
  thumbnailUrl?: string;
};

export type CachedVideoMetadata = {
  title: string;
  description?: string;
  creator?: string;
  thumbnailUrl?: string;
};

export type BookmarkedPlaylist = {
  id: string;
  title: string;
  description: string;
  creator: string;
  thumbnailUrl: string;
  firstVideoId: string;
  videoCount: number;
};

export type AuditedCourse = BookmarkedPlaylist & {
  auditedAt: string;
};

export type SavedPlaylist = {
  id: string;
  title: string;
  sourceUrl: string;
  urls: string[];
  videoCount: number;
  savedAt: string;
};

export type FocusSession = {
  id: string;
  completedAt: string;
  minutes: number;
};
