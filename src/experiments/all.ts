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
];
