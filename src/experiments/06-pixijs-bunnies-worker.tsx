import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

async function renderBitmap(): Promise<ImageBitmap> {
  return new Promise((resolve) => {
    const worker = new Worker(
      new URL("./06-pixijs-bunnies-worker.worker.ts", import.meta.url),
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
  id: "pixijs-bunnies-worker",
  filename: "06-pixijs-bunnies-worker.tsx",
  name: "Pixi.js bunnies in a worker",
  description: "Pixi.js bunnies in a worker",
  Component,
};

export default example;
