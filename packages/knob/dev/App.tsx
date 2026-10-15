import { createSignal } from "solid-js";
import { Knob } from "../src";
import "./App.css";

const WAVES = ["Saw", "Pulse", "Tri", "Sine", "Noise"];

/** One knob's state, the way an app would hold it. */
const param = (initial: number) => {
  const [value, setValue] = createSignal(initial);
  return { value, setValue };
};

function Row(props: { class: string; title: string; note: string; obxd?: boolean }) {
  const cutoff = param(0.62);
  const reso = param(0.3);
  const wave = param(0.25);
  const env = param(0);
  const look = () =>
    props.obxd
      ? ({ cap: true, indicator: "pointer", valuePosition: "below", radius: 13 } as const)
      : {};
  return (
    <section>
      <h2>{props.title}</h2>
      <p class="muted">{props.note}</p>
      <div class={props.class}>
        <Knob
          label="Cutoff"
          value={cutoff.value()}
          onInput={cutoff.setValue}
          onReset={() => cutoff.setValue(0.5)}
          {...look()}
        />
        <Knob
          label="Reso"
          value={reso.value()}
          display={(reso.value() * 10).toFixed(1)}
          onInput={reso.setValue}
          onReset={() => reso.setValue(0)}
          {...look()}
        />
        <Knob
          label="Wave"
          value={wave.value()}
          display={WAVES[Math.round(wave.value() * (WAVES.length - 1))]}
          steps={WAVES.length}
          lo="Saw"
          hi="Noise"
          onInput={wave.setValue}
          {...look()}
        />
        <Knob label="Env amt" value={env.value()} onInput={env.setValue} {...look()} />
        <Knob label="Spare" value={0} onInput={() => {}} disabled {...look()} />
      </div>
    </section>
  );
}

export default function App() {
  return (
    <main>
      <h1>solid-knob</h1>
      <p class="muted">
        Drag in any direction (right and up raise; Shift for fine), double-tap to reset, or use the
        arrow, Page, Home and End keys.
      </p>
      <Row
        class="row pocketrig"
        title="Default"
        note="Value inside the ring, a cap riding the fill, a glow. A stepped knob notches its ring and names its ends where --knob-ends shows them."
      />
      <Row
        class="row obxd"
        obxd
        title="Hardware"
        note='cap, indicator="pointer", valuePosition="below", a smaller radius and a thicker --knob-stroke: the glow only while dragging, from [data-dragging] [data-part="fill"].'
      />
    </main>
  );
}
