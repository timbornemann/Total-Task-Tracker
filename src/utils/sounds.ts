export interface SoundOption {
  label: string;
  url: string;
}

// Built-in tones generated with the Web Audio API
// "tone:<frequency>:<duration>" -> sine wave at frequency Hz for duration seconds
// "pattern:<pattern>" -> pattern of frequencies and durations separated by semicolons
// Format: freq:duration;freq:duration;...
export const builtInSounds: SoundOption[] = [
  { label: "Beep 1", url: "tone:440:0.4" },
  { label: "Beep 2", url: "tone:660:0.4" },
  { label: "Beep 3", url: "tone:880:0.4" },
  
  // Simple notifications
  { label: "Notification", url: "pattern:660:0.1;0:0.05;660:0.1" },
  { label: "Double Beep", url: "pattern:440:0.1;0:0.1;440:0.1" },
  { label: "Triple Beep", url: "pattern:440:0.08;0:0.08;440:0.08;0:0.08;440:0.08" },
  
  // Status sounds
  { label: "Success", url: "pattern:440:0.1;0:0.05;660:0.1;0:0.05;880:0.2" },
  { label: "Error", url: "pattern:330:0.2;0:0.05;330:0.2" },
  { label: "Warning", url: "pattern:660:0.2;0:0.05;550:0.3" },
  
  // Task related
  { label: "Task Complete", url: "pattern:523:0.1;0:0.05;659:0.1;0:0.05;784:0.3" },
  { label: "Task Start", url: "pattern:392:0.1;0:0.05;523:0.2" },
  
  // Timer related
  { label: "Timer Tick", url: "tone:880:0.05" },
  { label: "Timer Complete", url: "pattern:880:0.1;0:0.1;880:0.1;0:0.1;880:0.3" },
  { label: "Pomodoro Break", url: "pattern:523:0.1;0:0.05;659:0.1;0:0.05;784:0.1;0:0.05;1047:0.3" },
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
    } else if (url.startsWith("pattern:")) {
      const patternPart = url.substring(8); // Remove "pattern:" prefix
      const segments = patternPart.split(";");
      const ctx = getAudioContext();
      
      if (ctx) {
        let currentTime = ctx.currentTime;
        
        // Play each segment of the pattern in sequence
        segments.forEach(segment => {
          const [freqStr, durStr] = segment.split(":");
          const freq = parseFloat(freqStr);
          const dur = parseFloat(durStr);
          
          if (!isNaN(freq) && !isNaN(dur)) {
            if (freq > 0) { // Skip silent segments (0 Hz)
              const osc = ctx.createOscillator();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, currentTime);
              osc.connect(ctx.destination);
              osc.start(currentTime);
              osc.stop(currentTime + dur);
            }
            currentTime += dur;
          }
        });
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
