import { createSignal, type Accessor } from "solid-js";

export type NoteHandlers = {
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
};

export type NoteTracker = {
  /** Put a pointer (a finger, the mouse) on a note. Moving it to another note
      releases the one it was on first. */
  press: (pointer: number, note: number, velocity: number) => void;
  /** Lift a pointer. */
  release: (pointer: number) => void;
  /** Lift every pointer: the instrument changed, the keys moved, the keyboard
      is going away. Each sounding note gets its note-off. */
  releaseAll: () => void;
  /** Whether any pointer is holding the note. */
  isHeld: (note: number) => boolean;
  held: Accessor<ReadonlySet<number>>;
};

/**
 * Which note each pointer is on, and exactly the note-ons and note-offs that
 * follow from it. Two fingers on one note sound it once and release it when the
 * second lifts. Whatever was sent is what gets released: a note that is
 * sounding never loses its note-off, whichever way its pointer goes.
 */
export function createNoteTracker(handlers: NoteHandlers): NoteTracker {
  const pointers = new Map<number, number>();
  const [held, setHeld] = createSignal<ReadonlySet<number>>(new Set());
  const holders = (note: number) => [...pointers.values()].filter((n) => n === note).length;
  const refresh = () => setHeld(new Set(pointers.values()));

  const release = (pointer: number) => {
    const note = pointers.get(pointer);
    if (note === undefined) return;
    pointers.delete(pointer);
    if (holders(note) === 0) handlers.onNoteOff?.(note);
    refresh();
  };

  const press = (pointer: number, note: number, velocity: number) => {
    const was = pointers.get(pointer);
    if (was === note) return;
    if (was !== undefined) release(pointer);
    pointers.set(pointer, note);
    if (holders(note) === 1) handlers.onNoteOn?.(note, velocity);
    refresh();
  };

  const releaseAll = () => {
    // Deleting the entry being visited is safe in a Map iteration.
    for (const pointer of pointers.keys()) release(pointer);
  };

  return { press, release, releaseAll, held, isHeld: (note) => held().has(note) };
}
