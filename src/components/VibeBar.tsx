import { useVibeStore } from "@/lib/vibeStore";
import { audioEngine } from "@/lib/audioEngine";
import { VIBES, type Vibe } from "@/lib/vibes";
import { Volume2, VolumeX, Loader2, Sparkles } from "lucide-react";

export function VibeBar() {
  const { vibe, scores, modelReady, classifying, audioEnabled, muted, setAudioEnabled, setMuted } =
    useVibeStore();

  const toggleAudio = () => {
    if (!audioEnabled) {
      setAudioEnabled(true);
      audioEngine.setVibe(vibe);
    } else {
      setAudioEnabled(false);
      audioEngine.stop();
    }
  };
  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    audioEngine.setMuted(m);
  };

  return (
    <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
      <div className="mx-auto max-w-5xl px-5 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="vibe-pulse inline-block h-3 w-3 rounded-full vibe-bg" />
          <span className="font-serif text-lg vibe-text leading-none">{vibe}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 ml-2 text-xs text-muted-foreground">
          {classifying ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> reading…
            </span>
          ) : modelReady ? (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> model ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> warming up local model…
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <VibeMeter scores={scores} active={vibe} />
          <button
            onClick={toggleAudio}
            className="rounded-full px-3 py-1.5 text-xs font-medium border border-border hover:bg-secondary transition-colors"
          >
            {audioEnabled ? "Music on" : "Enable music"}
          </button>
          <button
            onClick={toggleMute}
            disabled={!audioEnabled}
            className="rounded-full p-2 border border-border hover:bg-secondary transition-colors disabled:opacity-40"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function VibeMeter({
  scores,
  active,
}: {
  scores: { label: Vibe; score: number }[];
  active: Vibe;
}) {
  const map = new Map(scores.map((s) => [s.label, s.score]));
  return (
    <div className="hidden lg:flex items-end gap-0.5 h-7">
      {VIBES.map((v) => {
        const s = map.get(v) ?? 0;
        const h = Math.max(4, Math.round(s * 100));
        const isActive = v === active;
        return (
          <div
            key={v}
            title={`${v} ${(s * 100).toFixed(0)}%`}
            className="w-1.5 rounded-sm transition-all"
            style={{
              height: `${h}%`,
              background: isActive ? "var(--vibe-glow)" : "color-mix(in oklab, var(--foreground) 25%, transparent)",
            }}
          />
        );
      })}
    </div>
  );
}
