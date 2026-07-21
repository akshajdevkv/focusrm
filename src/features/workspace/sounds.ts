import { AmbientSound } from "@/types/focus";

export const ambientSounds: AmbientSound[] = [
  {
    category: "Nature",
    name: "Birds Chirping",
    tone: "birds",
    audioSrc: "/audio/birds-chirping.mp3"
  },
  { category: "Nature", name: "Breeze", tone: "breeze", audioSrc: "/audio/breeze.mp3" },
  {
    category: "Weather",
    name: "Smooth Rain",
    tone: "smooth-rain",
    audioSrc: "/audio/smooth-rain.mp3"
  },
  {
    category: "Weather",
    name: "Thunder Lightning",
    tone: "thunder-lightning",
    audioSrc: "/audio/thunder-lightning.mp3"
  },
  {
    category: "Ambience",
    name: "Coffee Shop Noise",
    tone: "coffee-shop",
    audioSrc: "/audio/coffee-shop-noise.mp3"
  },
  {
    category: "Ambience",
    name: "Ocean Waves",
    tone: "waves",
    audioSrc: "/audio/ocean-waves.mp3"
  },
  { category: "Ambience", name: "Fireplace", tone: "fireplace", audioSrc: "/audio/fireplace.mp3" },
  {
    category: "Music",
    name: "Rhythmic Music",
    tone: "rhythm",
    audioSrc: "/audio/rhythmic-music.mp3"
  }
];
