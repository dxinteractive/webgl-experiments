import type { ExperimentDefinition } from "../types";

import blank from "./00-blank";
import offscreenCanvas from "./01-offscreen-canvas";
import offscreenCanvasWorker from "./02-offscreen-canvas-worker";
import pixijsBunnies from "./03-pixijs-bunnies";
import pixijsBunniesOffscreen from "./04-pixijs-bunnies-offscreen";
import pixijsBunniesOffscreen2 from "./05-pixijs-bunnies-offscreen-2";
import pixijsBunniesWorker from "./06-pixijs-bunnies-worker";
import pixijsBunniesWorkerTransfer from "./07-pixijs-bunnies-worker-transfer";
import threejsHelloWorld from "./08-threejs-hello-world";
import threejsHelloWorldOffscreen from "./09-threejs-hello-world-offscreen";
import threejsTexture from "./10-threejs-texture";
import pixijsBlendModes from "./11-pixijs-blend-modes";
import twojsHelloWorld from "./12-twojs-hello-world";
import labColor from "./13-lab-color";
import oklabColor from "./14-oklab-color";
import webglSetup from "./15-webgl-setup";
import webglSetupStreamlined from "./16-webgl-setup-streamlined";
import webglTexture from "./17-webgl-texture";
import webglTextureUpscale from "./18-webgl-texture-upscale";
import webglTextureStreamlined from "./19-webgl-texture-streamlined";
import webglTextureDataIn from "./20-webgl-texture-data-in";
import webglTextureDataFloats from "./21-webgl-texture-data-floats";
import webglExtractFramebuffer from "./22-webgl-extract-framebuffer";
import webglBufferInterleaved from "./23-webgl-buffer-interleaved";
import webglInstancing from "./24-webgl-instancing";
import webglOklabColor from "./25-webgl-oklab-color";

export const all: ExperimentDefinition[] = [
  blank,
  offscreenCanvas,
  offscreenCanvasWorker,
  pixijsBunnies,
  pixijsBunniesOffscreen,
  pixijsBunniesOffscreen2,
  pixijsBunniesWorker,
  pixijsBunniesWorkerTransfer,
  threejsHelloWorld,
  threejsHelloWorldOffscreen,
  threejsTexture,
  pixijsBlendModes,
  twojsHelloWorld,
  labColor,
  oklabColor,
  webglSetup,
  webglSetupStreamlined,
  webglTexture,
  webglTextureUpscale,
  webglTextureStreamlined,
  webglTextureDataIn,
  webglTextureDataFloats,
  webglExtractFramebuffer,
  webglBufferInterleaved,
  webglInstancing,
  webglOklabColor,
];
