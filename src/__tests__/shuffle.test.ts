import { describe, it, expect } from "vitest";
import { shuffleArray } from "@/utils/shuffle";

describe("shuffleArray", () => {
  it("returns a new array with same elements", () => {
    const input = [1, 2, 3, 4];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect(result).toEqual(expect.arrayContaining(input));
    expect(result).not.toBe(input);
  });
});
