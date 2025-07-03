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
