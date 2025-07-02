import en from "@/locales/en/translation.json";
import de from "@/locales/de/translation.json";
import { describe, it, expect } from "vitest";

function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as Record<string, unknown>, newKey);
    }
    return [newKey];
  });
}

describe("i18n key consistency", () => {
  it("en and de translations have the same keys", () => {
    const enKeys = collectKeys(en).sort();
    const deKeys = collectKeys(de).sort();
    expect(deKeys).toEqual(enKeys);
  });
});
