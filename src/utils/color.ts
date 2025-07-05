const sanitizeHex = (hex?: string): string | null => {
  if (!hex) return null;
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  return h.length === 6 ? h : null;
};

export const hexToHsl = (hex: string): string => {
  const h = sanitizeHex(hex) || "000000";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hh = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hh = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hh = (b - r) / d + 2;
        break;
      case b:
        hh = (r - g) / d + 4;
        break;
    }
    hh /= 6;
  }
  return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const hslToHex = (hsl: string): string => {
  const [hStr, sStr, lStr] = hsl.split(/\s+/);
  const h = parseFloat(hStr) / 360;
  const s = parseFloat(sStr) / 100;
  const l = parseFloat(lStr) / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const isColorDark = (hex: string): boolean => {
  const h = sanitizeHex(hex);
  if (!h) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
};

export const adjustColor = (hex: string, percent: number): string => {
  const h = sanitizeHex(hex) || "000000";
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  const amt = Math.round(2.55 * percent);
  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));
  const toHex = (x: number) => x.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const complementarySameHue = (
  hex: string,
  start = 60,
  threshold = 128,
): string => {
  const dark = isColorDark(hex);
  let perc = dark ? start : -start;
  let adjusted = adjustColor(hex, perc);
  let contrast = colorContrast(hex, adjusted);
  while (contrast < threshold && Math.abs(perc) < 100) {
    perc += perc > 0 ? 10 : -10;
    adjusted = adjustColor(hex, perc);
    contrast = colorContrast(hex, adjusted);
  }
  return adjusted;
};

export const complementaryColor = (hex: string): string => {
  const dark = isColorDark(hex);
  const adjusted = adjustColor(hex, dark ? 60 : -60);
  if (colorContrast(hex, adjusted) < 128) {
    const blackContrast = colorContrast(hex, "#000000");
    const whiteContrast = colorContrast(hex, "#ffffff");
    return blackContrast > whiteContrast ? "#000000" : "#ffffff";
  }
  return adjusted;
};

export const colorContrast = (hex1: string, hex2: string): number => {
  const h1 = sanitizeHex(hex1) || "000000";
  const h2 = sanitizeHex(hex2) || "000000";
  const r1 = parseInt(h1.slice(0, 2), 16);
  const g1 = parseInt(h1.slice(2, 4), 16);
  const b1 = parseInt(h1.slice(4, 6), 16);
  const r2 = parseInt(h2.slice(0, 2), 16);
  const g2 = parseInt(h2.slice(2, 4), 16);
  const b2 = parseInt(h2.slice(4, 6), 16);
  const yiq1 = (r1 * 299 + g1 * 587 + b1 * 114) / 1000;
  const yiq2 = (r2 * 299 + g2 * 587 + b2 * 114) / 1000;
  return Math.abs(yiq1 - yiq2);
};

export const paletteToGradient = (colors: string[]): string =>
  `linear-gradient(to right, ${colors.join(", ")})`;

export const weightedGradient = (
  colors: string[],
  weights: number[],
): string => {
  if (colors.length !== weights.length) return paletteToGradient(colors);
  const total = weights.reduce((s, w) => s + w, 0);
  let acc = 0;
  const stops = colors.map((c, i) => {
    const start = (acc / total) * 100;
    acc += weights[i];
    const end = (acc / total) * 100;
    return `${c} ${start}% ${end}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
};

export const themeToGradient = (
  theme: Record<string, string>,
  palette: string[],
): string => {
  const colors = [
    `hsl(${theme.background})`,
    `hsl(${theme.foreground})`,
    `hsl(${theme.accent})`,
    ...palette,
  ];
  const weights = [3, 2, 2, ...new Array(palette.length).fill(1)];
  return weightedGradient(colors, weights);
};
