import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const WIDTH = 256;
const HEIGHT = 256;

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
  outColor = vec4(v_uv.x, 0.0, v_uv.y, 1.0);
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

  // render quad to canvas
  gl.useProgram(gradientProgram);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(50, 150, 50, 50);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.disable(gl.SCISSOR_TEST);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-scissor",
  filename: "31-webgl-scissor.tsx",
  name: "WebGL scissor",
  description: "Renders only a small region of a gradient using gl.scissor",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
