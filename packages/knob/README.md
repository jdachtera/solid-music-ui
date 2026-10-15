# solid-knob

A rotary knob for [Solid](https://www.solidjs.com/) that behaves on a phone and over a network:

- **Relative drag** in any direction: right and up raise, left and down lower, and the axes sum. A tap changes nothing, so brushing a knob never jumps it. Shift for fine.
- **A hold against round trips.** While it is dragged, and for a moment after, the knob shows its own value over the `value` prop. A value that comes back from an audio engine or a remote host a frame late can't snap it back mid-gesture.
- **Steps**: a stepped knob snaps to its positions, notches its ring at each, and can name its ends.
- **Double-tap to reset**, and the arrow, Page, Home and End keys. It is a proper `role="slider"`.
- **Several fingers at once**: a drag follows only the pointer that started it.
- **A glow that iOS draws** (WebKit ignores filters on SVG children; this one is on its own `<svg>`).
- **Skinnable**: custom properties for colours and sizes, structural options (a cap, a pointer line, the value under the ring), a `face` to draw anything else, and `data-part` hooks on every element.

## Install

```sh
pnpm add solid-knob
```

## Use

```tsx
import { Knob } from "solid-knob";

<Knob label="Cutoff" value={cutoff()} onInput={setCutoff} onReset={() => setCutoff(0.5)} />;
```

The value is always 0..1. Say what it means with `display`:

```tsx
<Knob
  label="Wave"
  value={wave()}
  display={WAVES[Math.round(wave() * (WAVES.length - 1))]}
  steps={WAVES.length}
  lo="Saw"
  hi="Noise"
  onInput={setWave}
/>
```

### Props

| prop                       | default        |                                                                                                                              |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `label`                    |                | Under the knob, and its accessible name.                                                                                     |
| `value`                    |                | 0..1.                                                                                                                        |
| `onInput`                  |                | `(value) => void`, on every change.                                                                                          |
| `display`                  | the percentage | The value as text.                                                                                                           |
| `steps`, `lo`, `hi`        |                | A knob of `steps` positions, and the names of its ends (shown where `--knob-ends` is `block`).                               |
| `onReset`                  |                | Called on a double tap.                                                                                                      |
| `disabled`                 |                | Shown, not turnable: a spare slot.                                                                                           |
| `onFeedback`               |                | `(kind) => void` with `"tap"` (pressed), `"tick"` (a step passed) or `"bump"` (an end reached, or reset), for haptics.       |
| `onDragStart`, `onDragEnd` |                | A drag begins and ends: a plugin host's automation gesture.                                                                  |
| `holdMs`                   | `250`          | How long after a drag the knob's own value wins.                                                                             |
| `travel`                   | `200`          | Pixels of drag for the whole range.                                                                                          |
| `fine`                     | `0.2`          | What a drag counts for with Shift held.                                                                                      |
| `valuePosition`            | `"inside"`     | The value's text inside the ring, or `"below"` it.                                                                           |
| `indicator`                | `"thumb"`      | A cap riding the end of the fill, a `"pointer"` line from the centre, or `"none"`.                                           |
| `cap`                      |                | A disc in the middle, lit from the upper left.                                                                               |
| `radius`                   | `15.9`         | The arc's radius in the dial's 36-unit box. Smaller leaves room for a thicker ring or a cap.                                 |
| `face`                     |                | `(dial) => JSX`: more SVG, drawn over the rest in the dial's box, with `dial.value()`, `dial.radius` and `dial.point(v, r)`. |
| `class`                    |                | Added to the knob's own.                                                                                                     |

### Styling

The built-in styles have no specificity (they are all inside `:where()`), so your own rules always win.

| property          | default   |                                                                                               |
| ----------------- | --------- | --------------------------------------------------------------------------------------------- |
| `--knob-accent`   | `#ff7a2f` | The fill and its glow.                                                                        |
| `--knob-track`    | `#4a4f5e` | The unfilled travel.                                                                          |
| `--knob-panel`    | `#2b2f3a` | What the knob sits on: notches, the thumb's and the cap's edges.                              |
| `--knob-thumb`    | `#e8eaf0` | The thumb.                                                                                    |
| `--knob-pointer`  | `#15161a` | The pointer line.                                                                             |
| `--knob-cap`      |           | The cap's fill. Or set its gradient: `--knob-cap-light`, `--knob-cap-mid`, `--knob-cap-dark`. |
| `--knob-label`    | `#8b90a0` | The label and the end names.                                                                  |
| `--knob-focus`    | `#3a8cff` | The keyboard focus ring.                                                                      |
| `--knob-font`     | monospace | The value and the end names.                                                                  |
| `--knob-stroke`   | `3.2px`   | The ring's thickness (1px is one unit of the 36-unit dial).                                   |
| `--knob-halo`     | `0.55`    | The glow's opacity; `0` for none.                                                             |
| `--knob-ring-max` | `60px`    | The largest the ring grows; it fills its column's width up to this.                           |
| `--knob-type`     | `1`       | A scale for all its text.                                                                     |
| `--knob-ends`     | `none`    | `block` names a stepped knob's ends.                                                          |

Every element carries a `data-part`: `ring`, `halo`, `dial`, `track`, `fill`, `notch`, `cap`, `thumb`, `pointer`, `value`, `lo`, `hi`, `label`. The knob has `data-dragging` while it is held and `data-disabled` when disabled. A hardware look, the glow only while turning:

```css
.synth {
  --knob-accent: #e8a33d;
  --knob-track: #17181c;
  --knob-stroke: 3px;
  --knob-halo: 0;
}
.synth [data-dragging] [data-part="fill"] {
  filter: drop-shadow(0 0 1.5px #e8a33d);
}
```

```tsx
<Knob class="synth" cap indicator="pointer" valuePosition="below" radius={13} … />
```

## Without the knob

`trackDrag(event, element, from, onValue, onEnd?, travel?, fine?)` is the drag on its own: relative, captured, following only the pointer that started it.
