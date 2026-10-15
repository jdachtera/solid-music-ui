import { describe, expect, it } from "vitest";
import { isBlack, keySpan, keysInRange, noteName, rangeSpan, whiteIndex } from "../src";

describe("notes", () => {
  it("knows the black keys", () => {
    expect([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71].map(isBlack)).toEqual([
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
    expect(isBlack(-1)).toBe(false); // B below MIDI 0
  });

  it("names notes with middle C as C4 unless told otherwise", () => {
    expect(noteName(60)).toBe("C4");
    expect(noteName(61)).toBe("C#4");
    expect(noteName(0)).toBe("C-1");
    expect(noteName(60, 3)).toBe("C3");
  });

  it("counts white keys, a black key sitting on the line between two", () => {
    expect(whiteIndex(0)).toBe(0);
    expect(whiteIndex(1)).toBe(1);
    expect(whiteIndex(2)).toBe(1);
    expect(whiteIndex(11)).toBe(6);
    expect(whiteIndex(12)).toBe(7);
    expect(whiteIndex(60)).toBe(35);
  });
});

describe("piano layout", () => {
  it("gives white keys a unit each and centres black keys on the line", () => {
    expect(keySpan(60, "piano")).toEqual({ start: 35, size: 1 });
    const cSharp = keySpan(61, "piano");
    expect(cSharp.start + cSharp.size / 2).toBe(36);
  });

  it("leaves out a black key at either end of the range", () => {
    expect(keysInRange(61, 66, "piano")).toEqual([62, 63, 64, 65]);
    expect(rangeSpan(61, 66, "piano")).toEqual({ start: 36, size: 3 });
  });

  it("spans the white keys of the range", () => {
    expect(rangeSpan(60, 71, "piano")).toEqual({ start: 35, size: 7 });
    expect(rangeSpan(0, 127, "piano")).toEqual({ start: 0, size: 75 });
  });
});

describe("rows layout", () => {
  it("gives every semitone a row, as a piano roll's grid does", () => {
    expect(keySpan(61, "rows")).toEqual({ start: 61, size: 1 });
    expect(rangeSpan(0, 127, "rows")).toEqual({ start: 0, size: 128 });
    expect(keysInRange(61, 66, "rows")).toEqual([61, 62, 63, 64, 65, 66]);
  });

  it("reaches a white key halfway under each black neighbour", () => {
    expect(keySpan(60, "rows")).toEqual({ start: 60, size: 1.5 }); // C: C# above
    expect(keySpan(62, "rows")).toEqual({ start: 61.5, size: 2 }); // D: C# and D#
    expect(keySpan(64, "rows")).toEqual({ start: 63.5, size: 1.5 }); // E: D# below
  });
});
