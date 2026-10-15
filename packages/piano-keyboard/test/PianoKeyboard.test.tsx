import { createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PianoKeyboard, type KeyboardAxis } from "../src";

let cleanup: (() => void) | undefined;
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = "";
});

const mount = (ui: () => JSX.Element) => {
  const container = document.createElement("div");
  document.body.append(container);
  cleanup = render(ui, container);
  return container;
};

const key = (root: HTMLElement, note: number) =>
  root.querySelector<HTMLElement>(`[data-note="${note}"]`)!;

/** jsdom does no layout: say which element is under the pointer, and how
    tall, so velocity comes from where on the key it lands. */
const pointAt = (el: Element | null, box = { top: 0, left: 0, width: 20, height: 100 }) => {
  document.elementFromPoint = () => el;
  if (el) el.getBoundingClientRect = () => ({ ...box, right: 0, bottom: 0, x: 0, y: 0 }) as DOMRect;
};

const pointer = (type: string, pointerId: number, clientY = 100) =>
  new MouseEvent(type, { bubbles: true, clientX: 10, clientY }) as MouseEvent & {
    pointerId: number;
    pointerType: string;
  };

const fire = (target: Element, type: string, pointerId: number, clientY?: number) => {
  const event = pointer(type, pointerId, clientY);
  Object.assign(event, { pointerId, pointerType: "touch" });
  target.dispatchEvent(event);
};

describe("PianoKeyboard", () => {
  it("renders the range as white and black keys", () => {
    const root = mount(() => <PianoKeyboard low={60} high={72} />);
    const keys = root.querySelectorAll("[data-note]");
    expect(keys).toHaveLength(13);
    expect(key(root, 61).dataset["color"]).toBe("black");
    expect(key(root, 60).style.left).toBe("0%");
    expect(key(root, 72).style.width).toBe("12.5%");
  });

  it("stands upright with the high notes at the top", () => {
    const root = mount(() => <PianoKeyboard low={60} high={71} orientation="vertical" />);
    expect(key(root, 71).style.top).toBe("0%");
    expect(parseFloat(key(root, 60).style.top)).toBeGreaterThan(80);
  });

  it("places keys through an axis and skips the ones out of view", () => {
    const axis: KeyboardAxis = {
      dimensions: (position, length) => ({ offset: position * 10, size: length * 10 }),
      isVisible: ({ offset, size }) => offset + size > 0 && offset < 50,
    };
    const root = mount(() => (
      <PianoKeyboard low={0} high={127} layout="rows" orientation="vertical" axis={axis} />
    ));
    // The top five rows: 127 down to 123, plus the white key reaching up into 122.
    expect(
      [...root.querySelectorAll<HTMLElement>("[data-note]")].map((k) => k.dataset["note"]),
    ).toEqual(["122", "123", "124", "125", "126", "127"]);
    // G9 reaches half a row above the top into G#9, which MIDI does not have.
    expect(key(root, 127).style.top).toBe("-5px");
  });

  it("plays with several fingers, slides, and velocity from the depth of the strike", () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    const root = mount(() => (
      <PianoKeyboard low={60} high={72} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
    ));
    const keyboard = root.firstElementChild!;

    pointAt(key(root, 60));
    fire(keyboard, "pointerdown", 1, 100); // at the front
    expect(onNoteOn).toHaveBeenLastCalledWith(60, 1);
    expect(key(root, 60).dataset["down"]).toBe("");

    pointAt(key(root, 64));
    fire(keyboard, "pointerdown", 2, 0); // at the back
    expect(onNoteOn).toHaveBeenLastCalledWith(64, 0.35);

    pointAt(key(root, 62));
    fire(keyboard, "pointermove", 1);
    expect(onNoteOff).toHaveBeenLastCalledWith(60);
    expect(onNoteOn).toHaveBeenLastCalledWith(62, 1);

    pointAt(null);
    fire(keyboard, "pointermove", 1);
    expect(onNoteOff).toHaveBeenLastCalledWith(62);

    fire(keyboard, "pointerup", 2);
    expect(onNoteOff).toHaveBeenLastCalledWith(64);
    expect(root.querySelectorAll("[data-down]")).toHaveLength(0);
  });

  it("does not play on a hover", () => {
    const onNoteOn = vi.fn();
    const root = mount(() => <PianoKeyboard onNoteOn={onNoteOn} />);
    pointAt(key(root, 60));
    fire(root.firstElementChild!, "pointermove", 1);
    expect(onNoteOn).not.toHaveBeenCalled();
  });

  it("releases held notes when its resetKey changes, and when it goes away", () => {
    const onNoteOff = vi.fn();
    const [track, setTrack] = createSignal(0);
    const root = mount(() => <PianoKeyboard resetKey={track()} onNoteOff={onNoteOff} />);
    pointAt(key(root, 60));
    fire(root.firstElementChild!, "pointerdown", 1);
    setTrack(1);
    expect(onNoteOff).toHaveBeenCalledWith(60);

    pointAt(key(root, 62));
    fire(root.firstElementChild!, "pointerdown", 2);
    cleanup?.();
    cleanup = undefined;
    expect(onNoteOff).toHaveBeenLastCalledWith(62);
  });

  it("shows notes held elsewhere as down", () => {
    const root = mount(() => <PianoKeyboard isDown={(note) => note === 67} />);
    expect(key(root, 67).dataset["down"]).toBe("");
    expect(key(root, 65).dataset["down"]).toBeUndefined();
  });

  it("labels the Cs, named the way the caller counts octaves", () => {
    const root = mount(() => <PianoKeyboard low={48} high={72} labels="c" middleC={3} />);
    expect(key(root, 60).textContent).toBe("C3");
    expect(key(root, 62).textContent).toBe("");
  });
});
