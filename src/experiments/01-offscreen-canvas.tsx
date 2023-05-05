import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

function renderBitmap() {
  const offscreen = new OffscreenCanvas(400, 400);
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("Could not create 2d offscreen canvas context");

  const a = Math.random() * 250 - 125;
  const b = Math.random() * 250 - 125;
  ctx.fillStyle = `lab(50% ${a} ${b})`;
  ctx.fillRect(0, 0, 400, 400);
  return offscreen.transferToImageBitmap();
}

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2d canvas context");
    }
    ctx.drawImage(renderBitmap(), 0, 0);
  }, []);
  return <canvas ref={ref} width={400} height={400} />;
}

const example: ExperimentDefinition = {
  id: "offscreen-canvas",
  filename: "01-offscreen-canvas.tsx",
  name: "Offscreen canvas",
  description: "Usage of an offscreen canvas",
  Component,
};

export default example;
