import type { ExperimentDefinition } from "../types";

import blank from "./00-blank";
import offscreenCanvas from "./01-offscreen-canvas";
import offscreenCanvasWorker from "./02-offscreen-canvas-worker";
import pixijsBunnies from "./03-pixijs-bunnies";
import pixijsBunniesOffscreen from "./04-pixijs-bunnies-offscreen";
import pixijsBunniesOffscreen2 from "./05-pixijs-bunnies-offscreen-2";
import pixijsBunniesWorker from "./06-pixijs-bunnies-worker";
import pixijsBunniesWorkerTransfer from "./07-pixijs-bunnies-worker-transfer";

export const all: ExperimentDefinition[] = [
  blank,
  offscreenCanvas,
  offscreenCanvasWorker,
  pixijsBunnies,
  pixijsBunniesOffscreen,
  pixijsBunniesOffscreen2,
  pixijsBunniesWorker,
  pixijsBunniesWorkerTransfer,
];
