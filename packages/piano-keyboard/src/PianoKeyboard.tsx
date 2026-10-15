import styles from "./PianoKeyboard.module.css";

import {
  createEffect,
  createMemo,
  Index,
  type JSX,
  on,
  onCleanup,
  Show,
  splitProps,
} from "solid-js";

import { createNoteTracker, type NoteHandlers } from "./createNoteTracker";
import { keySpan, keysInRange, rangeSpan, type KeyLayout } from "./layout";
import { isBlack, noteName } from "./notes";
import { notePointerHandlers, type Velocity } from "./notePointer";

/** Anything that places a span of layout units on screen and says whether it
    is in view. A solid-viewport axis (`useAxis(name)`) is one. */
export type KeyboardAxis = {
  dimensions: (position: number, length: number) => { offset: number; size: number };
  isVisible: (dimensions: { offset: number; size: number }) => boolean;
};

/** Extra classes for the keys, added to the keyboard's own. */
export type PianoKeyboardClasses = {
  key?: string;
  white?: string;
  black?: string;
  down?: string;
  label?: string;
};

export type PianoKeyboardProps = NoteHandlers & {
  /** Lowest and highest MIDI note on the keyboard, inclusive. */
  low?: number;
  high?: number;
  /** `horizontal`: low notes on the left, the keys' fronts at the bottom.
      `vertical`: low notes at the bottom, the fronts on the right, as down the
      side of a piano roll. */
  orientation?: "horizontal" | "vertical";
  /** See KeyLayout. Defaults to `piano`; a keyboard beside a roll's grid wants
      `rows`. */
  layout?: KeyLayout;
  /** Place the keys through this axis instead of stretching them over the
      keyboard's box: it scrolls and zooms them, and keys out of view are not
      rendered. Its value space is the layout's units, counted from the left
      (horizontal) or from the top, the high end (vertical). */
  axis?: KeyboardAxis;
  /** Show a key as down without a finger on it: notes playing back, or held on
      a MIDI controller. */
  isDown?: (note: number) => boolean;
  /** A fixed velocity (0–1), or one from where the key was struck, 0 at its
      back and 1 at its front. Defaults to 0.35 at the back to 1 at the front. */
  velocity?: Velocity;
  /** Note names on the keys: none (default), each C, or every key. */
  labels?: "none" | "c" | "all";
  /** The octave number middle C (60) is named with. 4 by default ("C4"). */
  middleC?: number;
  /** Changing this releases every held note: the instrument or track the keys
      play changed, and what was pressed belongs to the old one. */
  resetKey?: unknown;
  classes?: PianoKeyboardClasses;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, "onPointerDown" | "onPointerMove" | "onPointerUp">;

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

export function PianoKeyboard(props: PianoKeyboardProps) {
  const [local, rest] = splitProps(props, [
    "low",
    "high",
    "orientation",
    "layout",
    "axis",
    "isDown",
    "velocity",
    "labels",
    "middleC",
    "resetKey",
    "classes",
    "onNoteOn",
    "onNoteOff",
    "class",
  ]);

  const low = () => local.low ?? 48;
  const high = () => local.high ?? 72;
  const vertical = () => local.orientation === "vertical";
  const layout = () => local.layout ?? "piano";

  const tracker = createNoteTracker({
    onNoteOn: (note, velocity) => local.onNoteOn?.(note, velocity),
    onNoteOff: (note) => local.onNoteOff?.(note),
  });
  const pointer = notePointerHandlers({
    tracker,
    depth: () => (vertical() ? "right" : "down"),
    velocity: () => local.velocity,
  });

  // Keys that move or change hands strand whatever was held on them.
  createEffect(
    on([() => local.resetKey, low, high, layout, vertical], () => tracker.releaseAll(), {
      defer: true,
    }),
  );
  onCleanup(() => tracker.releaseAll());

  const notes = createMemo(() => keysInRange(low(), high(), layout()));
  const range = createMemo(() => rangeSpan(low(), high(), layout()));

  /** A key's span in the axis's value space: from the low end, or from the
      high end when the keyboard stands upright. */
  const place = (note: number) => {
    const span = keySpan(note, layout());
    const { start, size } = range();
    const offset = vertical() ? start + size - (span.start + span.size) : span.start - start;
    return { offset, size: span.size };
  };

  const label = (note: number) => {
    const shown = local.labels ?? "none";
    return shown === "all" || (shown === "c" && note % 12 === 0)
      ? noteName(note, local.middleC)
      : "";
  };

  return (
    <div
      role="group"
      aria-label="Piano keyboard"
      {...rest}
      class={cx(
        styles["keyboard"],
        vertical() ? styles["vertical"] : styles["horizontal"],
        local.class,
      )}
      {...pointer}
    >
      <Index each={notes()}>
        {(note) => {
          const black = () => isBlack(note());
          const down = () => tracker.isHeld(note()) || (local.isDown?.(note()) ?? false);
          const placed = createMemo(() => {
            const { offset, size } = place(note());
            if (local.axis) {
              const dims = local.axis.dimensions(offset, size);
              return {
                visible: local.axis.isVisible(dims),
                start: `${dims.offset}px`,
                size: `${dims.size}px`,
              };
            }
            const total = range().size || 1;
            return {
              visible: true,
              start: `${(offset / total) * 100}%`,
              size: `${(size / total) * 100}%`,
            };
          });
          return (
            <Show when={placed().visible}>
              <div
                data-note={note()}
                data-color={black() ? "black" : "white"}
                data-down={down() ? "" : undefined}
                title={noteName(note(), local.middleC)}
                class={cx(
                  styles["key"],
                  black() ? styles["black"] : styles["white"],
                  down() && styles["down"],
                  local.classes?.key,
                  black() ? local.classes?.black : local.classes?.white,
                  down() && local.classes?.down,
                )}
                style={
                  vertical()
                    ? { top: placed().start, height: placed().size }
                    : { left: placed().start, width: placed().size }
                }
              >
                <Show when={label(note())}>
                  {(text) => (
                    <span class={cx(styles["label"], local.classes?.label)}>{text()}</span>
                  )}
                </Show>
              </div>
            </Show>
          );
        }}
      </Index>
    </div>
  );
}
