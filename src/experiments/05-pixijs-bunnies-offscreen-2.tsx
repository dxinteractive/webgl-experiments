import * as PIXI from "pixi.js";
import type { ExperimentDefinition } from "../types";
import { useEffect, useRef } from "react";

async function renderBitmap() {
  const offscreen = new OffscreenCanvas(400, 400);
  const ctx = offscreen.getContext("2d");
  if (!ctx) throw new Error("Could not create 2d offscreen canvas context");

  const renderer = new PIXI.Renderer({
    background: "#1099bb",
    view: offscreen,
  });

  const container = new PIXI.Container();

  // Create a new texture
  const texture = PIXI.Texture.from("bunny.png");

  await new Promise((r) => setTimeout(r, 200));

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new PIXI.Sprite(texture);
    bunny.anchor.set(0.5);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
  }

  renderer.render(container);

  return offscreen;
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
  id: "pixijs-bunnies-offscreen-2",
  filename: "05-pixijs-bunnies-offscreen-2.tsx",
  name: "Pixi.js bunnies on offscreen canvas 2",
  description: "Using new OffscreenCanvas()",
  Component,
};

export default example;
