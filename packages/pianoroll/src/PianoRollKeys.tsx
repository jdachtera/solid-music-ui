import styles from "./PianoRollKeys.module.css";
import { createMemo } from "solid-js";
import { PianoKeyboard } from "solid-piano-keyboard";
import { ScrollContainer, useAxis } from "solid-viewport";
import { usePianoRollContext } from "./PianoRollContext";

const PianoRollKeys = () => {
  const verticalViewPort = createMemo(() => useAxis("vertical"));
  const horizontalViewPort = createMemo(() => useAxis("horizontalKeys"));
  const context = usePianoRollContext();

  // The track each sounding key was pressed for. Its release goes to that
  // track even when the selection has moved on since, or the new track would
  // get a note-off it never had a note-on for and the old one would hang.
  const pressedOn = new Map<number, number>();

  return (
    <div class={styles.PianoRollKeys} style={{ width: `${horizontalViewPort().pixelSize}px` }}>
      <ScrollContainer horizontalAxis="horizontalKeys" style={{ "z-index": 4 }}>
        <PianoKeyboard
          class={styles.Keyboard}
          low={0}
          high={127}
          orientation="vertical"
          layout="rows"
          axis={verticalViewPort()}
          middleC={3}
          resetKey={context.selectedTrackIndex}
          isDown={(note) => context.isKeyDown(context.selectedTrackIndex, note)}
          onNoteOn={(note, velocity) => {
            pressedOn.set(note, context.selectedTrackIndex);
            context.onNoteDown(context.selectedTrackIndex, note, velocity);
          }}
          onNoteOff={(note) => {
            const track = pressedOn.get(note) ?? context.selectedTrackIndex;
            pressedOn.delete(note);
            context.onNoteUp(track, note);
          }}
          classes={{ key: styles.Key, white: styles.white, black: styles.black, down: styles.down }}
        />
      </ScrollContainer>
    </div>
  );
};

export const blackKeys = [1, 3, 6, 8, 10];
export const keyNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const keys = Array.from({ length: 128 }).map((_, index) => ({
  number: index,
  name: `${keyNames[index % 12]} ${Math.floor(index / 12) - 2}`,
  isBlack: blackKeys.includes(index % 12),
}));

export default PianoRollKeys;
