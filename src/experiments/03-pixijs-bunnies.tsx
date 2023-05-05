import * as PIXI from "pixi.js";
import type { ExperimentDefinition } from "../types";
import { useEffect, useRef } from "react";

function createBunnies(view: HTMLCanvasElement) {
  const app = new PIXI.Application({
    background: "#1099bb",
    view,
  });

  const container = new PIXI.Container();

  app.stage.addChild(container);

  // Create a new texture
  const texture = PIXI.Texture.from("bunny.png");

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new PIXI.Sprite(texture);
    bunny.anchor.set(0.5);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
  }

  // Move container to the center
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;

  // Center bunny sprite in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

  // Listen for animate update
  app.ticker.add((delta) => {
    // rotate the container!
    // use delta to create frame-independent transform
    container.rotation -= 0.01 * delta;
  });
}

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!ref.current) {
      throw new Error("Could not find canvas element");
    }
    createBunnies(ref.current);
  }, []);
  return <canvas ref={ref} width={400} height={400} />;
}

const example: ExperimentDefinition = {
  id: "pixijs-bunnies",
  filename: "03-pixijs-bunnies.tsx",
  name: "Pixi.js Bunnies",
  description: "Hello world for Pixi.js.",
  Component,
};

export default example;
