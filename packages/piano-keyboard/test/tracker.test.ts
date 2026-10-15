import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { createNoteTracker } from "../src";

const setup = () =>
  createRoot((dispose) => {
    const log: string[] = [];
    const tracker = createNoteTracker({
      onNoteOn: (note, velocity) => log.push(`on ${note} ${velocity}`),
      onNoteOff: (note) => log.push(`off ${note}`),
    });
    return { tracker, log, dispose };
  });

describe("createNoteTracker", () => {
  it("sounds a note once however many fingers hold it", () => {
    const { tracker, log } = setup();
    tracker.press(1, 60, 0.5);
    tracker.press(2, 60, 0.9);
    tracker.release(1);
    expect(log).toEqual(["on 60 0.5"]);
    expect(tracker.isHeld(60)).toBe(true);
    tracker.release(2);
    expect(log).toEqual(["on 60 0.5", "off 60"]);
    expect(tracker.isHeld(60)).toBe(false);
  });

  it("moves a sliding finger from note to note", () => {
    const { tracker, log } = setup();
    tracker.press(1, 60, 1);
    tracker.press(1, 60, 1);
    tracker.press(1, 62, 1);
    tracker.release(1);
    expect(log).toEqual(["on 60 1", "off 60", "on 62 1", "off 62"]);
  });

  it("does not release a note another finger still holds when one slides off it", () => {
    const { tracker, log } = setup();
    tracker.press(1, 60, 1);
    tracker.press(2, 60, 1);
    tracker.press(1, 62, 1);
    expect(log).toEqual(["on 60 1", "on 62 1"]);
    expect([...tracker.held()].sort()).toEqual([60, 62]);
  });

  it("releases everything it sounded, and nothing twice", () => {
    const { tracker, log } = setup();
    tracker.press(1, 60, 1);
    tracker.press(2, 64, 1);
    tracker.press(3, 64, 1);
    tracker.releaseAll();
    tracker.releaseAll();
    tracker.release(1);
    expect(log).toEqual(["on 60 1", "on 64 1", "off 60", "off 64"]);
    expect(tracker.held().size).toBe(0);
  });
});
