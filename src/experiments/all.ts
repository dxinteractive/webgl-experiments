import type { ExperimentDefinition } from "../types";

import blank from "./00-blank";
import offscreenCanvas from "./01-offscreen-canvas";
import offscreenCanvasWorker from "./02-offscreen-canvas-worker";
import pixijsBunnies from "./03-pixijs-bunnies";

export const all: ExperimentDefinition[] = [
  blank,
  offscreenCanvas,
  offscreenCanvasWorker,
  pixijsBunnies,
];
