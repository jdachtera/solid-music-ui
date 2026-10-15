# solid-piano-keyboard

A piano keyboard for [Solid](https://www.solidjs.com/) that you can actually play on a phone:

- **Several fingers at once**, each tracked on its own. Two fingers on one key sound it once and release it when the second lifts.
- **Glissando**: a slide plays every key it passes over.
- **Velocity from where the key is struck**: nearer its front is louder.
- **No stuck notes**: whatever got a note-on gets its note-off, when the finger lifts, the keys move, `resetKey` changes or the keyboard unmounts.
- **Two layouts**: `piano` (equal white keys, like the real thing) and `rows` (equal semitones, lined up with a piano roll's grid).
- **Fits its box, or follows an axis**: stretch a range of keys across the keyboard's width or height, or hand it a [solid-viewport](../viewport) axis to scroll and zoom it; then only the keys in view are rendered.

It makes no sound. You get `onNoteOn(note, velocity)` and `onNoteOff(note)`.

## Install

```sh
pnpm add solid-piano-keyboard
```

## Use

```tsx
import { PianoKeyboard } from "solid-piano-keyboard";

<PianoKeyboard
  low={48}
  high={72}
  labels="c"
  onNoteOn={(note, velocity) => synth.noteOn(note, velocity)}
  onNoteOff={(note) => synth.noteOff(note)}
  style={{ height: "160px" }}
/>;
```

Down the side of a piano roll, scrolled and zoomed with its pitch axis:

```tsx
<PianoKeyboard
  low={0}
  high={127}
  orientation="vertical"
  layout="rows"
  axis={useAxis("vertical")}
  isDown={(note) => playback.isPlaying(note)}
  resetKey={selectedTrack()}
  onNoteOn={...}
  onNoteOff={...}
/>
```

### Props

| prop                    | default                            |                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `low`, `high`           | `48`, `72`                         | MIDI notes at either end, inclusive. In `piano` layout a black key at an end is left out.                                                                                                                        |
| `orientation`           | `"horizontal"`                     | `horizontal`: low notes left, the keys' fronts at the bottom. `vertical`: low notes at the bottom, fronts on the right.                                                                                          |
| `layout`                | `"piano"`                          | `piano` or `rows`, see above.                                                                                                                                                                                    |
| `axis`                  |                                    | Something with `dimensions(position, length)` and `isVisible(dimensions)`, e.g. a solid-viewport axis. Its value space is the layout's units (white keys or semitones), from the left or, upright, from the top. |
| `onNoteOn`, `onNoteOff` |                                    | `(note, velocity)` with velocity 0–1, and `(note)`.                                                                                                                                                              |
| `isDown`                |                                    | `(note) => boolean`: show keys as down that nobody is touching, e.g. notes playing back.                                                                                                                         |
| `velocity`              | 0.35 at the back to 1 at the front | A fixed number, or `(depth) => number` with depth 0 at a key's back and 1 at its front.                                                                                                                          |
| `labels`                | `"none"`                           | `"c"` names each C, `"all"` every key.                                                                                                                                                                           |
| `middleC`               | `4`                                | The octave note 60 is named with: `C4`, or pass `3` for `C3`.                                                                                                                                                    |
| `resetKey`              |                                    | Changing it releases every held note: the instrument the keys play changed.                                                                                                                                      |
| `classes`               |                                    | Extra classes for `key`, `white`, `black`, `down` and `label`.                                                                                                                                                   |

Any other prop goes to the keyboard's `<div>`.

### Styling

The built-in styles have no specificity (they are all inside `:where()`), so your own classes always win. Colours come from custom properties:

`--piano-keyboard-white`, `--piano-keyboard-black`, `--piano-keyboard-down`, `--piano-keyboard-line`, `--piano-keyboard-label`, `--piano-keyboard-label-black`, and `--piano-keyboard-black-length` (how far a black key reaches, 62% by default).

Each key carries `data-note`, `data-color="white|black"` and, while down, `data-down`, for CSS and tests.

## Without the keyboard

The parts are exported for anything else that is played with notes, like a grid of drum pads:

```tsx
import { createNoteTracker, notePointerHandlers } from "solid-piano-keyboard";

const tracker = createNoteTracker({ onNoteOn, onNoteOff });

<div {...notePointerHandlers({ tracker, depth: () => "down" })}>
  <For each={pads}>
    {(pad) => (
      <div data-note={pad.note} classList={{ down: tracker.isHeld(pad.note) }}>
        {pad.name}
      </div>
    )}
  </For>
</div>;
```

Also exported: `keySpan`, `keysInRange` and `rangeSpan` (the layout math), and `isBlack`, `noteName` and `whiteIndex`.
