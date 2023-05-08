(function() {
  "use strict";
  const _self = self;
  function renderBitmap() {
    const offscreen = new OffscreenCanvas(400, 400);
    const ctx = offscreen.getContext("2d");
    if (!ctx)
      throw new Error("Could not create 2d offscreen canvas context");
    const a = Math.random() * 250 - 125;
    const b = Math.random() * 250 - 125;
    ctx.fillStyle = `lab(50% ${a} ${b})`;
    ctx.fillRect(0, 0, 400, 400);
    return offscreen.transferToImageBitmap();
  }
  _self.addEventListener("message", async () => {
    const bitmap = renderBitmap();
    _self.postMessage(bitmap, [bitmap]);
  });
})();
