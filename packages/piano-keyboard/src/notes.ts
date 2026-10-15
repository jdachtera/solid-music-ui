// MIDI note numbers and the piano's pattern of white and black keys.

const BLACK = [false, true, false, true, false, false, true, false, true, false, true, false];
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
/** How many white keys of an octave lie below each pitch class. */
const WHITES_BELOW = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];

const pitchClass = (note: number) => ((note % 12) + 12) % 12;

export const isBlack = (note: number): boolean => BLACK[pitchClass(note)]!;

/** "C4" for 60 with the default `middleC` of 4. Plenty of software (Yamaha,
    Ableton, the old solid-pianoroll) calls 60 "C3": pass 3. */
export const noteName = (note: number, middleC = 4): string =>
  `${NAMES[pitchClass(note)]}${Math.floor(note / 12) - 5 + middleC}`;

/** A note's place among the white keys, counted from MIDI note 0. A black key
    gets the boundary it sits on: C#'s is 1, between C (0) and D (1). */
export const whiteIndex = (note: number): number =>
  Math.floor(note / 12) * 7 + WHITES_BELOW[pitchClass(note)]!;
