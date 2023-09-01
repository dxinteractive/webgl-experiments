import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

import * as THREE from "three";

async function renderBitmap(w: number, h: number): Promise<ImageBitmap> {
  const bunnySize = [26, 37];
  const canvas = new OffscreenCanvas(w, h);

  const perspective = 100;
  const fov = (180 * (2 * Math.atan(h / 2 / perspective))) / Math.PI;
  const camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 1000);
  camera.position.z = perspective;

  const loader = new THREE.TextureLoader();
  const texture = await loader.loadAsync("/bunny.png");

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    // alphaTest: 0.9,
  });
  const geometry = new THREE.PlaneGeometry(bunnySize[0], bunnySize[1]);
  const mesh1 = new THREE.Mesh(geometry, material);
  const mesh2 = new THREE.Mesh(geometry, material);
  mesh2.position.x = 10;
  // mesh2.position.z = 26;
  const scene = new THREE.Scene();
  scene.add(mesh1);
  scene.add(mesh2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  renderer.render(scene, camera);
  return canvas.transferToImageBitmap();
}

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = ref.current?.getContext("2d");
    if (!canvas || !ctx) {
      throw new Error("Could not create 2d canvas context");
    }
    renderBitmap(canvas.width, canvas.height).then((bitmap) => {
      ctx.drawImage(bitmap, 0, 0);
    });
  }, []);
  return (
    <>
      <canvas ref={ref} width={260} height={370} />
      <img src="/bunny.png" />
    </>
  );
}

const example: ExperimentDefinition = {
  id: "threejs-texture",
  filename: "10-threejs-texture.tsx",
  name: "Three rendering a texture",
  description: "Three.js rendering a texture",
  Component,
};

export default example;
