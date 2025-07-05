export interface SoundOption {
  label: string;
  url: string;
}

// Built-in tones generated with the Web Audio API
// "tone:<frequency>:<duration>" -> sine wave at frequency Hz for duration seconds
export const builtInSounds: SoundOption[] = [
  { label: "Beep 1", url: "tone:440:0.4" },
  { label: "Beep 2", url: "tone:660:0.4" },
  { label: "Beep 3", url: "tone:880:0.4" },
];

type AudioContextConstructor = typeof AudioContext;

const getAudioContext = (): AudioContext | null => {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;
  return Ctor ? new Ctor() : null;
};

export const playSound = (url?: string) => {
  if (url) {
    if (url.startsWith("tone:")) {
      const [, freqStr, durStr] = url.split(":");
      const freq = parseFloat(freqStr) || 440;
      const dur = parseFloat(durStr) || 0.4;
      const ctx = getAudioContext();
      if (ctx) {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
        return;
      }
    } else {
      try {
        const audio = new Audio(url);
        audio.play().catch(() => {});
        return;
      } catch {
        // ignore errors
      }
    }
  }
  const ctx = getAudioContext();
  if (ctx) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }
};
