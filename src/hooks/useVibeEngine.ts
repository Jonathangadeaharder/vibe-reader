import { useEffect, useRef } from "react";
import { useVibeStore } from "@/lib/vibeStore";
import { audioEngine } from "@/lib/audioEngine";
import type { Vibe } from "@/lib/vibes";
import VibeWorker from "@/lib/vibeWorker?worker";
import type { VibeWorkerIn, VibeWorkerOut } from "@/lib/vibeWorker";

export function useVibeEngine() {
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const setModelReady = useVibeStore((s) => s.setModelReady);
  const setClassifying = useVibeStore((s) => s.setClassifying);
  const setVibe = useVibeStore((s) => s.setVibe);

  useEffect(() => {
    const w = new VibeWorker();
    workerRef.current = w;
    w.onmessage = (e: MessageEvent<VibeWorkerOut>) => {
      const msg = e.data;
      if (msg.type === "ready") setModelReady(true);
      else if (msg.type === "result") {
        setVibe(msg.vibe as Vibe, msg.scores);
        setClassifying(false);
        if (useVibeStore.getState().audioEnabled) {
          audioEngine.setVibe(msg.vibe as Vibe);
        }
      } else if (msg.type === "error") {
        console.error("[VibeWorker]", msg.error);
        setClassifying(false);
      }
    };
    const warmup: VibeWorkerIn = { type: "warmup" };
    w.postMessage(warmup);
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [setModelReady, setClassifying, setVibe]);

  const classify = (text: string) => {
    const w = workerRef.current;
    if (!w || !text?.trim()) return;
    setClassifying(true);
    const id = ++reqId.current;
    const msg: VibeWorkerIn = { type: "classify", id, text };
    w.postMessage(msg);
  };

  return { classify };
}
