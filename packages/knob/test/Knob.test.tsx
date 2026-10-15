import { createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Knob, type KnobFeedback } from "../src";

let cleanup: (() => void) | undefined;
beforeEach(() => {
  vi.useFakeTimers();
  // jsdom has no pointer capture; the knob only needs it not to throw.
  Element.prototype.setPointerCapture ??= () => {};
});
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const mount = (ui: () => JSX.Element) => {
  const container = document.createElement("div");
  document.body.append(container);
  cleanup = render(ui, container);
  return container.querySelector<HTMLElement>("[role=slider]")!;
};

const pointer = (el: Element, type: string, x: number, y: number, init: MouseEventInit = {}) => {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0, ...init });
  Object.assign(event, { pointerId: 1, pointerType: "touch" });
  el.dispatchEvent(event);
};
const key = (el: Element, k: string) =>
  el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
const part = (el: Element, name: string) => el.querySelector(`[data-part="${name}"]`);

describe("Knob", () => {
  it("drags relative to where it is, right and up raising", () => {
    const onInput = vi.fn();
    const knob = mount(() => <Knob label="Cutoff" value={0.5} onInput={onInput} />);
    pointer(knob, "pointerdown", 100, 100);
    pointer(knob, "pointermove", 120, 100); // 20px right: +0.1
    expect(onInput).toHaveBeenLastCalledWith(0.6);
    pointer(knob, "pointermove", 120, 80); // and 20px up: +0.2
    expect(onInput).toHaveBeenLastCalledWith(expect.closeTo(0.7, 10));
    pointer(knob, "pointermove", 120, 80, { shiftKey: true }); // the same move, finely
    expect(onInput).toHaveBeenLastCalledWith(expect.closeTo(0.54, 10));
    pointer(knob, "pointerup", 120, 80);
  });

  it("keeps its own value over a stale one until the hold runs out", () => {
    const [value, setValue] = createSignal(0.5);
    const knob = mount(() => <Knob label="Mix" value={value()} onInput={() => {}} />);
    pointer(knob, "pointerdown", 0, 0);
    pointer(knob, "pointermove", 40, 0);
    pointer(knob, "pointerup", 40, 0);
    setValue(0.5); // a push from before the drag landed
    expect(knob.getAttribute("aria-valuenow")).toBe("70");
    vi.advanceTimersByTime(300);
    expect(knob.getAttribute("aria-valuenow")).toBe("50");
  });

  it("snaps a stepped knob to its steps, notches them and feels each", () => {
    const onInput = vi.fn();
    const felt: KnobFeedback[] = [];
    const knob = mount(() => (
      <Knob label="Wave" value={0} steps={5} onInput={onInput} onFeedback={(k) => felt.push(k)} />
    ));
    expect(knob.querySelectorAll('[data-part="notch"]')).toHaveLength(3);
    pointer(knob, "pointerdown", 0, 0);
    pointer(knob, "pointermove", 55, 0); // 0.275, nearest step 0.25
    expect(onInput).toHaveBeenLastCalledWith(0.25);
    pointer(knob, "pointermove", 300, 0); // to the end
    expect(onInput).toHaveBeenLastCalledWith(1);
    expect(felt).toEqual(["tap", "tick", "bump"]);
  });

  it("resets on a double tap, but not on the start of a drag", () => {
    const onReset = vi.fn();
    const knob = mount(() => <Knob label="Pan" value={0.2} onInput={() => {}} onReset={onReset} />);
    pointer(knob, "pointerdown", 0, 0);
    pointer(knob, "pointermove", 30, 0);
    pointer(knob, "pointerup", 30, 0);
    pointer(knob, "pointerdown", 30, 0);
    expect(onReset).not.toHaveBeenCalled(); // the first press was a drag
    pointer(knob, "pointerup", 30, 0);
    pointer(knob, "pointerdown", 30, 0);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("answers the keyboard", () => {
    const onInput = vi.fn();
    const knob = mount(() => <Knob label="Rate" value={0.5} onInput={onInput} />);
    key(knob, "ArrowUp");
    expect(onInput).toHaveBeenLastCalledWith(0.51);
    key(knob, "PageDown");
    expect(onInput).toHaveBeenLastCalledWith(expect.closeTo(0.41, 10));
    key(knob, "End");
    expect(onInput).toHaveBeenLastCalledWith(1);
  });

  it("reports a drag's start and end, and marks itself while held", () => {
    const events: string[] = [];
    const knob = mount(() => (
      <Knob
        label="Env"
        value={0}
        onInput={() => {}}
        onDragStart={() => events.push("start")}
        onDragEnd={() => events.push("end")}
      />
    ));
    pointer(knob, "pointerdown", 0, 0);
    expect(knob.hasAttribute("data-dragging")).toBe(true);
    pointer(knob, "pointerup", 0, 0);
    expect(knob.hasAttribute("data-dragging")).toBe(false);
    expect(events).toEqual(["start", "end"]);
  });

  it("does nothing while disabled", () => {
    const onInput = vi.fn();
    const knob = mount(() => <Knob label="Spare" value={0.5} disabled onInput={onInput} />);
    pointer(knob, "pointerdown", 0, 0);
    pointer(knob, "pointermove", 50, 0);
    key(knob, "ArrowUp");
    expect(onInput).not.toHaveBeenCalled();
    expect(part(knob, "value")?.textContent).toBe("—");
    expect(part(knob, "thumb")).toBeNull();
  });

  it("draws the parts it is asked for", () => {
    const knob = mount(() => (
      <Knob
        label="Reso"
        value={0.5}
        display="half"
        onInput={() => {}}
        cap
        indicator="pointer"
        valuePosition="below"
        face={(dial) => <circle data-part="extra" r={dial.radius} />}
      />
    ));
    expect(part(knob, "cap")).not.toBeNull();
    expect(part(knob, "pointer")).not.toBeNull();
    expect(part(knob, "thumb")).toBeNull();
    expect(part(knob, "extra")).not.toBeNull();
    // Under the ring, not in it.
    expect(part(knob, "ring")?.contains(part(knob, "value"))).toBe(false);
    expect(part(knob, "value")?.textContent).toBe("half");
    expect(knob.getAttribute("aria-valuetext")).toBe("half");
  });
});
