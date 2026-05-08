import { create } from "zustand";
import type { Vibe } from "./vibes";

interface VibeState {
  vibe: Vibe;
  scores: { label: Vibe; score: number }[];
  modelReady: boolean;
  classifying: boolean;
  audioEnabled: boolean;
  muted: boolean;
  setVibe: (v: Vibe, scores?: { label: Vibe; score: number }[]) => void;
  setModelReady: (r: boolean) => void;
  setClassifying: (c: boolean) => void;
  setAudioEnabled: (e: boolean) => void;
  setMuted: (m: boolean) => void;
}

export const useVibeStore = create<VibeState>((set) => ({
  vibe: "Calm",
  scores: [],
  modelReady: false,
  classifying: false,
  audioEnabled: false,
  muted: false,
  setVibe: (vibe, scores) => set({ vibe, ...(scores ? { scores } : {}) }),
  setModelReady: (modelReady) => set({ modelReady }),
  setClassifying: (classifying) => set({ classifying }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setMuted: (muted) => set({ muted }),
}));
