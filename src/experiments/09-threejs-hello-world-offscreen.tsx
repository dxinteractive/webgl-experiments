import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

import * as THREE from "three";

async function renderBitmap(): Promise<ImageBitmap> {
  const w = 400;
  const h = 400;
  const canvas = new OffscreenCanvas(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  // cant use renderer.setSize(); as it thinks offscreencanvas is an HTML canvas and tries to set .style properties
  canvas.width = w;
  canvas.height = h;
  renderer.setViewport(0, 0, w, h);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;
  renderer.render(scene, camera);
  return canvas.transferToImageBitmap();
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
  id: "threejs-hello-world-offscreen",
  filename: "08-threejs-hello-world-offscreen.tsx",
  name: "Three.js with offscreen canvas",
  description: "Three.js with offscreen canvas",
  Component,
};

export default example;
