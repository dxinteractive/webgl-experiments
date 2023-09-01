import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

function renderOffscreenCanvas(offscreen: OffscreenCanvas) {
  const worker = new Worker(
    new URL("./07-pixijs-bunnies-worker-transfer.worker.ts", import.meta.url),
    {
      type: "module",
    }
  );
  worker.postMessage(offscreen, [offscreen]);
}

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const transferred = useRef(false);
  useEffect(() => {
    if (transferred.current) return;

    const canvas = ref.current;
    if (!canvas) {
      throw new Error("Could not create canvas");
    }
    renderOffscreenCanvas(canvas.transferControlToOffscreen());
    transferred.current = true;
  }, []);
  return <canvas ref={ref} width={400} height={400} />;
}

const example: ExperimentDefinition = {
  id: "pixijs-bunnies-worker-transfer",
  filename: "06-pixijs-bunnies-worker-transfer.tsx",
  name: "Pixi bunnies in a worker using transferControlToOffscreen()",
  description: "Pixi.js bunnies in a worker using transferControlToOffscreen()",
  Component,
};

export default example;
