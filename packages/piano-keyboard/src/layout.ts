// Where each key lies along the keyboard, in layout units that grow with pitch.
// Pixels come later: the component scales the units to fit its box, or hands
// them to a viewport axis.

import { isBlack, whiteIndex } from "./notes";

/**
 * - `piano`: every white key the same width, black keys narrower and centred on
 *   the line between two whites. Units are white keys. A real keyboard.
 * - `rows`: every semitone the same height, so key N lines up with row N of a
 *   piano roll's grid. Units are semitones. A white key reaches halfway into
 *   the row of each black neighbour, under that black key.
 */
export type KeyLayout = "piano" | "rows";

export type Span = { start: number; size: number };

/** A black key's width in `piano` layout, as a fraction of a white key's. */
export const BLACK_WIDTH = 0.6;

export function keySpan(note: number, layout: KeyLayout): Span {
  if (layout === "rows") {
    if (isBlack(note)) return { start: note, size: 1 };
    const below = isBlack(note - 1) ? 0.5 : 0;
    const above = isBlack(note + 1) ? 0.5 : 0;
    return { start: note - below, size: 1 + below + above };
  }
  const white = whiteIndex(note);
  return isBlack(note)
    ? { start: white - BLACK_WIDTH / 2, size: BLACK_WIDTH }
    : { start: white, size: 1 };
}

/** The keys from `low` to `high` inclusive. In `piano` layout a black key at
    either end is left out: half of it would hang past the white keys. */
export function keysInRange(low: number, high: number, layout: KeyLayout): number[] {
  const keys: number[] = [];
  for (let note = low; note <= high; note += 1) {
    const edge = note === low || note === high;
    if (layout === "piano" && edge && isBlack(note)) continue;
    keys.push(note);
  }
  return keys;
}

/** The stretch of the keyboard the keys from `low` to `high` fill. In `rows`
    layout it is the rows themselves, so the end keys' half-row overhang (if
    any) falls outside it, as it falls outside a roll's grid. */
export function rangeSpan(low: number, high: number, layout: KeyLayout): Span {
  if (layout === "rows") return { start: low, size: Math.max(0, high - low + 1) };
  const first = whiteIndex(isBlack(low) ? low + 1 : low);
  const last = whiteIndex(isBlack(high) ? high - 1 : high);
  return { start: first, size: Math.max(0, last - first + 1) };
}
