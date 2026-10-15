import styles from "./Knob.module.css";

import { createSignal, createUniqueId, For, type JSX, Show } from "solid-js";
import { DEFAULT_TRAVEL_PX, trackDrag } from "./trackDrag";

// The dial is a 270° arc, 7:30 round through 12:00 to 4:30 clockwise, so it reads
// as a knob rather than a pie chart, with the 90° at the bottom left as the visual
// "stop". It is drawn in a 36-unit box, and the arcs carry pathLength="100", so
// `stroke-dasharray` reads directly as a percentage of the circle whatever the
// radius: ARC of it is the 270° sweep.
const SIZE = 36;
const C = SIZE / 2;
/** The default radius: its circumference comes out at ~100 units by itself. */
const RADIUS = 15.9155;
const ARC = 75; // 270/360 of the circumference, in pathLength units
const ROTATE = `rotate(135 ${C} ${C})`; // swings the dash's start from 3:00 to 7:30

/** The point on a circle of radius `r` for `v` (0..1): 135° (7:30) swept
    clockwise through 270°, in the dial's 36-unit box. */
export const pointOnDial = (v: number, r: number): { x: number; y: number } => {
  const a = ((135 + 270 * v) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

// A stepped knob notches its track at each inner step; past this many the
// notches would just be a dotted line.
const MAX_NOTCHES = 24;

/** A second tap this soon after a first resets. */
const DOUBLE_TAP_MS = 320;

/** What the knob felt like, for a caller with haptics: a press (`tap`), a step
    passed on a stepped knob (`tick`), an end reached or a reset (`bump`). */
export type KnobFeedback = "tap" | "tick" | "bump";

/** What a `face` draws with: the dial's 36-unit box, centred on (18, 18). */
export type KnobDial = {
  /** The value on screen, 0..1: the knob's own while it is held. */
  value: () => number;
  /** The arc's radius. */
  radius: number;
  /** The point at `v` (0..1) on a circle of radius `r` around the centre. */
  point: (v: number, r: number) => { x: number; y: number };
};

export type KnobProps = {
  label: string;
  /** 0..1. What sizes the ring even when `display` says something else. */
  value: number;
  /** The value as text: a percentage by default. A caller that knows the value
      is really a count, a switch or a mode says so here. Shows "—" while
      `disabled`. */
  display?: string;
  onInput: (value: number) => void;
  /** Shown, but nothing to turn: a spare slot. */
  disabled?: boolean;
  /** A knob that is really `steps` positions: it snaps to them, notches its
      ring at each, and (when `--knob-ends` shows them) names its ends `lo`
      and `hi`. */
  steps?: number | undefined;
  lo?: string | undefined;
  hi?: string | undefined;
  /** A double tap. The caller knows what the default is and sets it. */
  onReset?: (() => void) | undefined;
  onFeedback?: (kind: KnobFeedback) => void;
  /** A drag begins and ends: a plugin host's automation gesture. */
  onDragStart?: () => void;
  onDragEnd?: () => void;
  /** How long after a drag the knob keeps showing its own value over `value`
      (ms). See `hold` below. */
  holdMs?: number;
  /** Pixels of drag for the whole range. */
  travel?: number;
  /** What a drag with Shift held counts for: 0.2 by default, for fine
      placing. */
  fine?: number;

  // ---- how it looks, beyond the custom properties in Knob.module.css ----

  /** The value's text inside the ring (default) or under it, above the label. */
  valuePosition?: "inside" | "below";
  /** What shows where the knob points: a cap riding the end of the fill
      (default), a line from the centre, or nothing. */
  indicator?: "thumb" | "pointer" | "none";
  /** A disc in the middle, a knob's cap: a radial gradient from
      --knob-cap-light through --knob-cap-mid to --knob-cap-dark, or any
      fill in --knob-cap. */
  cap?: boolean;
  /** The arc's radius in the dial's 36-unit box. Smaller leaves room for a
      thicker ring (--knob-stroke) or a cap. */
  radius?: number;
  /** Anything else, drawn into the dial over the rest. */
  face?: (dial: KnobDial) => JSX.Element;
  class?: string;
};

/**
 * A labelled 0..1 value you can actually move.
 *
 * - `hold`: the value often comes from somewhere a round trip behind the
 *   finger (an audio engine, a remote host). Rendering it straight through
 *   makes every drag fight a stale frame: the ring snaps back, then forward,
 *   then back. So while dragging, and for `holdMs` after, the knob's own value
 *   wins, and `value` takes over once it has certainly caught up.
 * - Relative dragging, in any direction, from the value on screen, which
 *   `hold` guarantees is where the last drag left it. See trackDrag.
 * - The whole knob is the handle, label included. The ring is a few pixels of
 *   stroke and nobody hits a hairline arc on a phone.
 */
export function Knob(props: KnobProps) {
  const radius = () => props.radius ?? RADIUS;
  // The default radius's circumference is already ~100 units; normalising it
  // anyway shifts the dashes' anti-aliasing by a hair, so only another radius
  // gets pathLength.
  const pathLength = () => (props.radius === undefined ? undefined : 100);
  const gradient = createUniqueId();
  const notches = (): number[] => {
    const n = props.steps ?? 0;
    if (n < 3 || n > MAX_NOTCHES) return [];
    return Array.from({ length: n - 2 }, (_, k) => (k + 1) / (n - 1));
  };
  const [hold, setHold] = createSignal<number | null>(null);
  const [dragging, setDragging] = createSignal(false);
  let releaseTimer: number | undefined;

  const shown = (): number => hold() ?? props.value;
  const percent = (): number => Math.round(shown() * 100);
  const feel = (kind: KnobFeedback) => props.onFeedback?.(kind);
  const text = () => (props.disabled === true ? "—" : (props.display ?? `${percent()}%`));
  const below = () => props.valuePosition === "below";
  const indicator = () => props.indicator ?? "thumb";

  // A stepped knob lands on its steps: the drag runs smoothly underneath, but
  // what is shown and sent is the nearest position, and each one passed is
  // felt. Either kind of knob bumps at its ends.
  const snap = (v: number): number => {
    const n = props.steps ?? 0;
    return n >= 2 ? Math.round(v * (n - 1)) / (n - 1) : v;
  };
  const set = (raw: number): void => {
    const v = snap(raw);
    const was = shown();
    if (v === was) return;
    if ((v === 0 || v === 1) && was !== v) feel("bump");
    else if ((props.steps ?? 0) >= 2) feel("tick");
    setHold(v);
    props.onInput(v);
  };

  // Keep the local value for a beat after release: the next `value` may still
  // predate the last onInput, and letting that frame through is a visible snap.
  const release = (): void => {
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => setHold(null), props.holdMs ?? 250);
  };

  let knobEl: HTMLDivElement | undefined;

  // A tap is a press that moved nothing; a second one soon after resets. Taps,
  // not presses, so the start of a drag can never count as one.
  let lastTap = -Infinity;
  let moved = false;

  const onPointerDown = (e: PointerEvent): void => {
    if (props.disabled === true || e.button !== 0 || knobEl === undefined) return;
    if (props.onReset !== undefined && performance.now() - lastTap < DOUBLE_TAP_MS) {
      lastTap = -Infinity;
      window.clearTimeout(releaseTimer);
      setHold(null);
      feel("bump");
      props.onReset();
      return;
    }
    // Hold from the first frame: the drag starts where the knob already is, and
    // a value landing mid-gesture must not move the ground under it.
    setHold(shown());
    setDragging(true);
    feel("tap");
    props.onDragStart?.();
    moved = false;
    const down = performance.now();
    trackDrag(
      e,
      knobEl,
      shown(),
      (v) => {
        if (snap(v) !== shown()) moved = true;
        set(v);
      },
      () => {
        setDragging(false);
        release();
        props.onDragEnd?.();
        lastTap = moved || performance.now() - down > DOUBLE_TAP_MS ? -Infinity : performance.now();
      },
      props.travel ?? DEFAULT_TRAVEL_PX,
      props.fine,
    );
  };

  // Arrows nudge 1%, Page 10% (a stepped knob: one step), Home/End the ends.
  // The only way to set an exact value with a mouse in your other hand.
  const onKeyDown = (e: KeyboardEvent): void => {
    if (props.disabled === true) return;
    const n = props.steps ?? 0;
    const step = n >= 2 ? 1 / (n - 1) : e.key === "PageUp" || e.key === "PageDown" ? 0.1 : 0.01;
    let next: number | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "PageUp") next = shown() + step;
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "PageDown")
      next = shown() - step;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = 1;
    if (next === undefined) return;
    e.preventDefault();
    set(Math.min(1, Math.max(0, next)));
    release();
  };

  const fill = () => `${(percent() / 100) * ARC} 100`;

  return (
    <div
      ref={knobEl}
      class={[styles["knob"], props.disabled === true && styles["spare"], props.class]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      role="slider"
      tabIndex={props.disabled === true ? -1 : 0}
      aria-label={props.label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent()}
      aria-valuetext={props.disabled === true ? undefined : props.display}
      aria-disabled={props.disabled === true}
      data-disabled={props.disabled === true ? "" : undefined}
      data-dragging={dragging() ? "" : undefined}
    >
      <div class={styles["ring"]} data-part="ring">
        {/* The fill's glow: the same arc again, in its own <svg> under the dial,
            blurred as a whole. A filter on the arc itself (CSS or an SVG
            <filter>) draws nothing in iOS's web view (WebKit); one on an outer
            <svg> element does. */}
        <svg class={styles["halo"]} data-part="halo" viewBox="0 0 36 36" aria-hidden="true">
          <circle
            class={styles["haloArc"]}
            cx={C}
            cy={C}
            r={radius()}
            pathLength={pathLength()}
            transform={ROTATE}
            stroke-dasharray={fill()}
          />
        </svg>
        <svg class={styles["dial"]} data-part="dial" viewBox="0 0 36 36" aria-hidden="true">
          <Show when={props.cap === true}>
            <defs>
              <radialGradient id={gradient} cx="40%" cy="32%" r="75%">
                <stop class={styles["capLight"]} offset="0" />
                <stop class={styles["capMid"]} offset="0.45" />
                <stop class={styles["capDark"]} offset="1" />
              </radialGradient>
            </defs>
          </Show>
          <circle
            class={styles["track"]}
            data-part="track"
            cx={C}
            cy={C}
            r={radius()}
            pathLength={pathLength()}
            transform={ROTATE}
          />
          <circle
            class={styles["progress"]}
            data-part="fill"
            cx={C}
            cy={C}
            r={radius()}
            pathLength={pathLength()}
            transform={ROTATE}
            stroke-dasharray={fill()}
          />
          {/* Notches: short cuts across the ring in the panel's colour, so the
              steps read as gaps in the track and the fill alike. */}
          <For each={notches()}>
            {(v) => {
              const inner = pointOnDial(v, radius() - 2.4);
              const outer = pointOnDial(v, radius() + 2.4);
              return (
                <line
                  class={styles["notch"]}
                  data-part="notch"
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                />
              );
            }}
          </For>
          <Show when={props.cap === true}>
            <circle
              class={styles["cap"]}
              data-part="cap"
              cx={C}
              cy={C}
              r={radius() * 0.65}
              style={{ fill: `var(--knob-cap, url(#${gradient}))` }}
            />
          </Show>
          <Show when={props.disabled !== true && indicator() === "thumb"}>
            <circle
              class={styles["thumb"]}
              data-part="thumb"
              cx={pointOnDial(shown(), radius()).x}
              cy={pointOnDial(shown(), radius()).y}
              r="2.3"
            />
          </Show>
          <Show when={props.disabled !== true && indicator() === "pointer"}>
            <line
              class={styles["pointer"]}
              data-part="pointer"
              x1={C}
              y1={C}
              x2={pointOnDial(shown(), radius() * 0.55).x}
              y2={pointOnDial(shown(), radius() * 0.55).y}
            />
          </Show>
          {props.face?.({ value: shown, radius: radius(), point: pointOnDial })}
        </svg>
        <Show when={!below()}>
          <span class={styles["value"]} data-part="value">
            {text()}
          </span>
        </Show>
        <Show when={props.disabled !== true && props.lo !== undefined && props.hi !== undefined}>
          <span class={`${styles["end"]} ${styles["lo"]}`} data-part="lo">
            {props.lo}
          </span>
          <span class={`${styles["end"]} ${styles["hi"]}`} data-part="hi">
            {props.hi}
          </span>
        </Show>
      </div>
      <Show when={below()}>
        <span class={`${styles["value"]} ${styles["valueBelow"]}`} data-part="value">
          {text()}
        </span>
      </Show>
      <span class={styles["label"]} data-part="label">
        {props.label}
      </span>
    </div>
  );
}
