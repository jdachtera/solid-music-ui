import type { NoteTracker } from "./createNoteTracker";

/** Which way a key runs from its back (where black keys start) to its front
    (where it is played): down the screen, or to the right. */
export type KeyDepth = "down" | "right";

/** Velocity (0–1) from how far along the key, back (0) to front (1), it was
    struck. Nearer the front is louder, as on a real key. */
export type Velocity = number | ((depth: number) => number);

export const defaultVelocity = (depth: number) => 0.35 + 0.65 * depth;

export type NotePointerOptions = {
  tracker: NoteTracker;
  depth: () => KeyDepth;
  velocity?: () => Velocity | undefined;
};

/**
 * Pointer handlers for a container of note elements, anything carrying
 * `data-note`: the keys of a keyboard, a grid of drum pads. Put them on the
 * container, not the keys.
 *
 * The container captures each pointer it is pressed with and looks up the
 * element under it as it moves. That is what makes a slide play every key it
 * passes (a pointer captured by the key it went down on would keep playing that
 * key), and it lets several fingers play at once, each tracked on its own.
 */
export function notePointerHandlers({ tracker, depth, velocity }: NotePointerOptions) {
  const hit = (event: PointerEvent) => {
    const container = event.currentTarget as HTMLElement;
    const under = document.elementFromPoint(event.clientX, event.clientY);
    const key = under?.closest<HTMLElement>("[data-note]");
    if (!key || !container.contains(key)) return null;
    const note = Number(key.dataset["note"]);
    if (!Number.isFinite(note)) return null;
    const box = key.getBoundingClientRect();
    const along =
      depth() === "down"
        ? (event.clientY - box.top) / box.height
        : (event.clientX - box.left) / box.width;
    const v = velocity?.() ?? defaultVelocity;
    const struck = Math.min(1, Math.max(0, Number.isFinite(along) ? along : 1));
    return { note, velocity: typeof v === "function" ? v(struck) : v };
  };

  // Pointers that are down on the container. One that slides off the keys
  // stops its note but keeps playing when it slides back on; a mouse that is
  // only hovering plays nothing.
  const down = new Set<number>();

  const onPointerDown = (event: PointerEvent) => {
    // A mouse plays with its main button only; touch and pen with any contact.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    down.add(event.pointerId);
    const found = hit(event);
    if (found) tracker.press(event.pointerId, found.note, found.velocity);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!down.has(event.pointerId)) return;
    const found = hit(event);
    if (found) tracker.press(event.pointerId, found.note, found.velocity);
    else tracker.release(event.pointerId);
  };

  const onPointerUp = (event: PointerEvent) => {
    down.delete(event.pointerId);
    tracker.release(event.pointerId);
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onLostPointerCapture: onPointerUp,
  };
}
