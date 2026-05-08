/// <reference lib="webworker" />
// Vibe Engine Worker — runs transformers.js zero-shot classification off-thread.
import { pipeline, env } from "@xenova/transformers";
import { VIBES, type Vibe } from "./vibes";

// Pull weights from the Hugging Face CDN (no local model files required).
env.allowLocalModels = false;
env.useBrowserCache = true;

type Classifier = (
  text: string,
  labels: readonly string[],
) => Promise<{ labels: string[]; scores: number[] }>;

let classifierPromise: Promise<Classifier> | null = null;

function getClassifier() {
  if (!classifierPromise) {
    classifierPromise = pipeline(
      "zero-shot-classification",
      "Xenova/mobilebert-uncased-mnli",
      { quantized: true },
    ) as unknown as Promise<Classifier>;
  }
  return classifierPromise;
}

export type VibeWorkerIn =
  | { type: "warmup" }
  | { type: "classify"; id: number; text: string };

export type VibeWorkerOut =
  | { type: "ready" }
  | { type: "error"; error: string }
  | {
      type: "result";
      id: number;
      vibe: Vibe;
      scores: { label: Vibe; score: number }[];
    };

const post = (msg: VibeWorkerOut) =>
  (self as unknown as Worker).postMessage(msg);

self.onmessage = async (e: MessageEvent<VibeWorkerIn>) => {
  const msg = e.data;
  try {
    if (msg.type === "warmup") {
      await getClassifier();
      post({ type: "ready" });
      return;
    }
    if (msg.type === "classify") {
      const clf = await getClassifier();
      // Trim to a reasonable window — first ~1500 chars is plenty for vibe.
      const text = (msg.text || "").slice(0, 1500).trim();
      if (!text) {
        post({
          type: "result",
          id: msg.id,
          vibe: "Calm",
          scores: VIBES.map((v) => ({ label: v, score: 0 })),
        });
        return;
      }
      const out = await clf(text, VIBES);
      const scores = out.labels.map((l, i) => ({
        label: l as Vibe,
        score: out.scores[i],
      }));
      post({ type: "result", id: msg.id, vibe: scores[0].label, scores });
    }
  } catch (err) {
    post({ type: "error", error: (err as Error)?.message ?? String(err) });
  }
};

export {};
