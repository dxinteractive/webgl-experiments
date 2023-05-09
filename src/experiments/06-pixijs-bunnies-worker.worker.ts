import * as PIXI from "@pixi/webworker";

const _self = self as DedicatedWorkerGlobalScope & typeof globalThis;
export {};

async function renderBitmap() {
  console.log("worker begin");
  const offscreen = new OffscreenCanvas(400, 400);

  const renderer = new PIXI.Renderer({
    background: "#1099bb",
    view: offscreen,
    antialias: true,
  });

  const container = new PIXI.Container();

  // Create a new texture - this is not how the image path should be provided but it works for now
  const texture = PIXI.Texture.from("../../bunny.png");

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
  const bitmap = offscreen.transferToImageBitmap();
  console.log("worker done");

  return bitmap;
}

_self.addEventListener("message", async () => {
  const bitmap = await renderBitmap();
  _self.postMessage(bitmap, [bitmap]);
});
