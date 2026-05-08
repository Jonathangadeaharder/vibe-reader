import { Howl } from "howler";
import { VIBE_TRACKS, type Vibe } from "./vibes";

const FADE_MS = 3000;
const TARGET_VOL = 0.55;

class AudioEngine {
  private sounds = new Map<Vibe, Howl>();
  private current: Vibe | null = null;
  private muted = false;
  private masterVol = TARGET_VOL;

  private get(vibe: Vibe): Howl {
    let h = this.sounds.get(vibe);
    if (!h) {
      h = new Howl({
        src: [VIBE_TRACKS[vibe]],
        loop: true,
        volume: 0,
        html5: false,
        preload: true,
      });
      this.sounds.set(vibe, h);
    }
    return h;
  }

  setVibe(vibe: Vibe) {
    if (this.current === vibe) return;
    const next = this.get(vibe);
    if (!next.playing()) next.play();
    next.fade(next.volume(), this.muted ? 0 : this.masterVol, FADE_MS);

    if (this.current) {
      const prev = this.get(this.current);
      const startVol = prev.volume();
      prev.fade(startVol, 0, FADE_MS);
      setTimeout(() => prev.stop(), FADE_MS + 50);
    }
    this.current = vibe;
  }

  stop() {
    this.sounds.forEach((h) => {
      h.fade(h.volume(), 0, 600);
      setTimeout(() => h.stop(), 700);
    });
    this.current = null;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.current) {
      const h = this.get(this.current);
      h.fade(h.volume(), m ? 0 : this.masterVol, 400);
    }
  }
  isMuted() { return this.muted; }
  currentVibe() { return this.current; }
}

export const audioEngine = new AudioEngine();
