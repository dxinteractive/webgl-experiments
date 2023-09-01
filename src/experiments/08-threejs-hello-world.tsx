import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";

import * as THREE from "three";

function helloThreeJs(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  renderer.setSize(400, 400);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;
  renderer.render(scene, camera);
}

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      throw new Error("Could not find canvas");
    }
    helloThreeJs(canvas);
  }, []);
  return <canvas ref={ref} width={400} height={400} />;
}

const example: ExperimentDefinition = {
  id: "threejs-hello-world",
  filename: "08-threejs-hello-world.tsx",
  name: "Three hello world",
  description: "Three.js hello world",
  Component,
};

export default example;
