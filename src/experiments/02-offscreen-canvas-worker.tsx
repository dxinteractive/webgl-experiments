import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

async function renderBitmap(): Promise<ImageBitmap> {
  return new Promise((resolve) => {
    const worker = new Worker(
      new URL("./02-offscreen-canvas-worker.worker.ts", import.meta.url),
      {
        type: "module",
      }
    );
    worker.addEventListener("message", (e) => {
      resolve(e.data);
    });
    worker.postMessage("begin");
  });
}

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2d canvas context");
    }
    renderBitmap().then((bitmap) => {
      ctx.drawImage(bitmap, 0, 0);
    });
  }, []);
  return <canvas ref={ref} width={400} height={400} />;
}

const example: ExperimentDefinition = {
  id: "offscreen-canvas-worker",
  filename: "02-offscreen-canvas-worker.tsx",
  name: "Offscreen canvas in a worker",
  description: "Usage of an offscreen canvas in a worker",
  Component,
};

export default example;
