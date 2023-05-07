import * as PIXI from "pixi.js";

const _self = self as DedicatedWorkerGlobalScope & typeof globalThis;
export {};

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

_self.addEventListener("message", async () => {
  const bitmap = await renderBitmap();
  _self.postMessage(bitmap, [bitmap]);
});
