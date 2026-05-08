export const VIBES = [
  "Calm",
  "Suspense",
  "Action",
  "Romance",
  "Melancholy",
  "Mystery",
  "Epic",
] as const;

export type Vibe = (typeof VIBES)[number];

export const VIBE_TRACKS: Record<Vibe, string> = {
  Calm: "/audio/calm.mp3",
  Suspense: "/audio/suspense.mp3",
  Action: "/audio/action.mp3",
  Romance: "/audio/romance.mp3",
  Melancholy: "/audio/melancholy.mp3",
  Mystery: "/audio/mystery.mp3",
  Epic: "/audio/epic.mp3",
};

export const VIBE_DESCRIPTIONS: Record<Vibe, string> = {
  Calm: "Peaceful, serene, gentle, slow",
  Suspense: "Tense, foreboding, uneasy, nervous",
  Action: "Fast paced fight, chase, intense battle",
  Romance: "Loving, intimate, tender, passionate",
  Melancholy: "Sad, sorrowful, grieving, lonely",
  Mystery: "Strange, curious, secretive, puzzling",
  Epic: "Grand, heroic, triumphant, powerful",
};
