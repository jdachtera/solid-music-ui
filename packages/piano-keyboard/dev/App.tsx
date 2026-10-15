import { createSignal, For, type JSX } from "solid-js";
import { ScrollContainer, useAxis, ViewPort } from "solid-viewport";
import { createNoteTracker, noteName, notePointerHandlers, PianoKeyboard } from "../src";
import "./App.css";

// A small WebAudio synth so the demo can be heard: a triangle per note, its
// level from the velocity.
const synth = (() => {
  let ctx: AudioContext | undefined;
  const voices = new Map<number, { osc: OscillatorNode; gain: GainNode }>();
  return {
    on(note: number, velocity: number) {
      ctx ??= new AudioContext();
      void ctx.resume();
      const osc = new OscillatorNode(ctx, {
        type: "triangle",
        frequency: 440 * 2 ** ((note - 69) / 12),
      });
      const gain = new GainNode(ctx, { gain: 0 });
      gain.gain.setTargetAtTime(0.25 * velocity, ctx.currentTime, 0.005);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      voices.set(note, { osc, gain });
    },
    off(note: number) {
      const voice = voices.get(note);
      if (!voice || !ctx) return;
      voices.delete(note);
      voice.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      voice.osc.stop(ctx.currentTime + 0.5);
    },
  };
})();

function Log(props: { lines: string[] }) {
  return <div class="log">{props.lines.length ? props.lines.join(" · ") : "Play something."}</div>;
}

const useLog = () => {
  const [lines, setLines] = createSignal<string[]>([]);
  const push = (line: string) => setLines((all) => [line, ...all].slice(0, 6));
  return { lines, push };
};

function Section(props: { title: string; children: JSX.Element; note?: string }) {
  return (
    <section>
      <h2>{props.title}</h2>
      {props.note && <p class="muted">{props.note}</p>}
      {props.children}
    </section>
  );
}

function HorizontalDemo() {
  const log = useLog();
  const [octave, setOctave] = createSignal(3);
  return (
    <Section
      title="Fit to a width"
      note="Several fingers at once; slide to play each key passed over; nearer a key's front is louder."
    >
      <div class="controls">
        <button onClick={() => setOctave((o) => Math.max(-1, o - 1))}>◀ octave</button>
        <span>
          {noteName(12 * (octave() + 1))} – {noteName(12 * (octave() + 3))}
        </span>
        <button onClick={() => setOctave((o) => Math.min(7, o + 1))}>octave ▶</button>
      </div>
      <PianoKeyboard
        class="keyboard-horizontal"
        low={12 * (octave() + 1)}
        high={12 * (octave() + 3)}
        labels="c"
        onNoteOn={(note, velocity) => {
          synth.on(note, velocity);
          log.push(`${noteName(note)} on ${velocity.toFixed(2)}`);
        }}
        onNoteOff={(note) => {
          synth.off(note);
          log.push(`${noteName(note)} off`);
        }}
      />
      <Log lines={log.lines()} />
    </Section>
  );
}

function RollSideDemo() {
  const [position, setPosition] = createSignal(40);
  const [zoom, setZoom] = createSignal(3);
  const [height, setHeight] = createSignal(320);
  return (
    <Section
      title="Down the side of a roll"
      note="Rows layout through a solid-viewport axis: scroll, or Alt + wheel / pinch to zoom. Only the keys in view are rendered."
    >
      <div
        class="roll"
        ref={(el) => new ResizeObserver(() => setHeight(el.clientHeight)).observe(el)}
      >
        <ViewPort
          axes={{
            vertical: () => ({
              position: position(),
              range: 128,
              zoom: zoom(),
              pixelOffset: 0,
              pixelSize: height(),
              minZoom: 1,
              maxZoom: 8,
              onPositionChange: setPosition,
              onZoomChange: setZoom,
            }),
          }}
        >
          <RollSide />
        </ViewPort>
      </div>
    </Section>
  );
}

function RollSide() {
  const axis = useAxis("vertical");
  return (
    <ScrollContainer verticalAxis="vertical">
      <div class="roll-row">
        <PianoKeyboard
          class="keyboard-vertical"
          low={0}
          high={127}
          orientation="vertical"
          layout="rows"
          axis={axis}
          labels="c"
          onNoteOn={synth.on}
          onNoteOff={synth.off}
        />
        <div class="roll-grid">
          <For each={Array.from({ length: 128 }, (_, i) => i)}>
            {(row) => {
              const dims = () => axis.dimensions(127 - row, 1);
              return (
                <div
                  class="roll-line"
                  classList={{ "roll-line-c": row % 12 === 0 }}
                  style={{ top: `${dims().offset}px`, height: `${dims().size}px` }}
                />
              );
            }}
          </For>
        </div>
      </div>
    </ScrollContainer>
  );
}

const PADS = [
  { note: 36, name: "Kick" },
  { note: 38, name: "Snare" },
  { note: 42, name: "Closed hat" },
  { note: 46, name: "Open hat" },
  { note: 41, name: "Low tom" },
  { note: 45, name: "Mid tom" },
  { note: 49, name: "Crash" },
  { note: 51, name: "Ride" },
];

function PadsDemo() {
  const log = useLog();
  const tracker = createNoteTracker({
    onNoteOn: (note, velocity) => {
      synth.on(note + 24, velocity);
      log.push(`${PADS.find((p) => p.note === note)?.name} ${velocity.toFixed(2)}`);
    },
    onNoteOff: (note) => synth.off(note + 24),
  });
  const handlers = notePointerHandlers({ tracker, depth: () => "down" });
  return (
    <Section
      title="Anything with data-note"
      note="The tracker and pointer handlers on their own, here playing a grid of drum pads."
    >
      <div class="pads" {...handlers}>
        <For each={PADS}>
          {(pad) => (
            <div
              class="pad"
              data-note={pad.note}
              classList={{ "pad-down": tracker.isHeld(pad.note) }}
            >
              {pad.name}
            </div>
          )}
        </For>
      </div>
      <Log lines={log.lines()} />
    </Section>
  );
}

export default function App() {
  return (
    <main>
      <h1>solid-piano-keyboard</h1>
      <HorizontalDemo />
      <RollSideDemo />
      <PadsDemo />
    </main>
  );
}
