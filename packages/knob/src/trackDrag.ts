// Pointer events plus setPointerCapture, one implementation for mouse, trackpad
// and touch: a drag that leaves the element (or the window) still tracks and
// still gets its pointerup. Window-level mousemove listeners are what make a
// control stick when the finger leaves a phone's screen edge mid-sweep.

/** Pixels of travel for the full 0..1 range by default. Much longer than the
    knob itself: the knob is a readout, the gesture is not confined to it, and
    0.5% a pixel is fine enough to place a delay time by feel. */
export const DEFAULT_TRAVEL_PX = 200;

/**
 * Drive `onValue` from how far the pointer moves, in any direction, starting
 * at `from`.
 *
 * Relative, not absolute: there is no position along a bar for a tap to map
 * onto. Right and up raise, left and down lower, and the two axes sum, so a
 * diagonal works and neither hand position is the wrong one. A tap changes
 * nothing, which on a phone clamped to a stand is the better failure: brushing
 * a knob does not slam the value to where it was touched.
 *
 * Only the pointer that took hold moves it: another finger landing on the
 * same control, or anywhere else, does not.
 */
export function trackDrag(
  e: PointerEvent,
  el: HTMLElement,
  from: number,
  onValue: (value: number) => void,
  onEnd?: () => void,
  travelPx = DEFAULT_TRAVEL_PX,
  /** How much a Shift-held move counts, for placing a value finely. */
  fine = 0.2,
): void {
  const startX = e.clientX;
  const startY = e.clientY;

  el.setPointerCapture?.(e.pointerId);

  const move = (ev: PointerEvent): void => {
    if (ev.pointerId !== e.pointerId) return;
    const delta = (ev.clientX - startX - (ev.clientY - startY)) * (ev.shiftKey ? fine : 1);
    onValue(Math.min(1, Math.max(0, from + delta / travelPx)));
  };

  const up = (ev: PointerEvent): void => {
    if (ev.pointerId !== e.pointerId) return;
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    el.removeEventListener("pointercancel", up);
    onEnd?.();
  };

  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}
