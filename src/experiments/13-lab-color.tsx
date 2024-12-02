import { useEffect, useRef, useState } from "react";
import type { ExperimentDefinition } from "../types";

const size = 30;

function Component() {
  const [valueL, setL] = useState(10);
  const [valueA, setA] = useState(-5);
  const [valueB, setB] = useState(5);
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2d canvas context");
    }
    ctx.clearRect(0, 0, 1000, 700);

    for (let l = 0; l <= valueL; l++) {
      for (let x = valueA; x < 5; x++) {
        for (let y = -5; y < valueB; y++) {
          ctx.fillStyle = `lab(${l * 10}% ${x * 25} ${y * 25})`;
          ctx.fillRect(
            (x + 5) * size + l * 25,
            (y + 5) * size + (10 - l) * 25,
            size,
            size
          );
        }
      }
    }
  }, [valueL, valueA, valueB]);

  return (
    <>
      <Slider label="L" value={valueL} onChange={setL} min={0} max={10} />
      <Slider label="A" value={valueA} onChange={setA} min={-5} max={5} />
      <Slider label="B" value={valueB} onChange={setB} min={-5} max={5} />
      <canvas
        ref={ref}
        style={{ width: "1000px", height: "700px" }}
        width={1000}
        height={700}
      />
    </>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <input
        type="range"
        style={{ width: "400px" }}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {label}
      {": "}
      {value}
    </div>
  );
}

const example: ExperimentDefinition = {
  id: "lab-color",
  filename: "13-lab-color.tsx",
  name: "Lab color experiment",
  description: "Lab color experiment",
  Component,
};

export default example;
