import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const WIDTH = 8192;
const HEIGHT = 8192;

const quadVertexShader = `#version 300 es

in vec2 a_pos;
out vec2 v_uv;

void main() {
  gl_Position = vec4((a_pos * 2.0) - 1.0, 0, 1);
  v_uv = a_pos;
}
`;

const gradientFragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

void main() {
  for(int j = 0; j < 10000; j++) {
    outColor = vec4(v_uv.x, 0.0, v_uv.y, 1.0);
  }
}
`;

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("No EXT_color_buffer_float");
  }

  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  if (!ext) {
    throw new Error("EXT_disjoint_timer_query_webgl2 not supported.");
  }

  // programs
  const gradientProgram = createProgramForShaders(
    gl,
    quadVertexShader,
    gradientFragmentShader
  );

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  createAttribute(gl, gradientProgram, {
    name: "a_pos",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ),
    size: 2,
  });

  gl.useProgram(gradientProgram);

  const renderAndMeasure = async (): Promise<number> => {
    const timerQuery = gl.createQuery();
    if (!timerQuery) {
      throw new Error("no timer query");
    }
    gl.beginQuery(ext.TIME_ELAPSED_EXT, timerQuery);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.endQuery(ext.TIME_ELAPSED_EXT);

    return new Promise((resolve) => {
      const check = () => {
        if (gl.getQueryParameter(timerQuery, gl.QUERY_RESULT_AVAILABLE)) {
          const timeElapsed = gl.getQueryParameter(timerQuery, gl.QUERY_RESULT);
          resolve(timeElapsed);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  };

  // render quad to canvas without scissor
  (async () => {
    const REPEATS = 100;

    let total1 = 0;
    for (let i = 0; i < REPEATS; i++) {
      total1 += await renderAndMeasure();
    }
    console.log("avg time without scissor:", total1 / REPEATS);

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(50, 150, 1, 1);

    let total2 = 0;
    for (let i = 0; i < REPEATS; i++) {
      total2 += await renderAndMeasure();
    }
    console.log("avg time with scissor single pixel:", total2 / REPEATS);
  })();

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-scissor-perf",
  filename: "32-webgl-scissor-perf.tsx",
  name: "WebGL scissor perf test",
  description:
    "Renders a huge canvas with and without scissoring a single pixel to try to see any measurable evidence of performance differences. Answer: it does not, the discards might happen after the fragment shader",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
