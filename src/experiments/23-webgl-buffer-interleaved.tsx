import type { ExperimentDefinition } from "../types";
import {
  createProgramForShaders,
  getWebgl2Context,
  unbindAll,
  updateCanvasSize,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const vertexShader = `#version 300 es
precision highp float;

in vec2 aClipPosition;
in vec3 aColor;

out vec3 vColor;

void main() {
  gl_Position = vec4(aClipPosition, 0.0, 1.0);
  vColor = aColor;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec3 vColor;

out vec4 outColor;

void main() {
  outColor = vec4(vColor, 1.0);
}
`;

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);
  updateCanvasSize(canvas, gl);

  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // program
  const program = createProgramForShaders(gl, vertexShader, fragmentShader);

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  const ELEMENTS_PER_CHUNK = 5;
  const BYTES_IN_FLOAT = 4;

  const bufferData = [
    // triangle 1
    //  vertex 1
    //   position
    -0.7, 0.9,
    //   color
    1, 1, 0,
    //  vertex 2
    //   position
    -0.9, 0.5,
    //   color
    1, 0, 0,
    //  vertex 3
    //   position
    -0.5, 0.5,
    //   color
    1, 1, 1,
    // triangle 2
    //  vertex 1
    //   position
    0, 0.2,
    //   color
    0, 1, 1,
    //  vertex 2
    //   position
    -0.2, -0.2,
    //   color
    0, 1, 0,
    //  vertex 3
    //   position
    0.2, -0.2,
    //   color
    1, 1, 1,
    // triangle 3
    //  vertex 1
    //   position
    0.7, -0.5,
    //   color
    0, 1, 1,
    //  vertex 2
    //   position
    0.5, -0.9,
    //   color
    0, 0, 1,
    //  vertex 3
    //   position
    0.9, -0.9,
    //   color
    1, 1, 1,
  ];

  const buffer = resources.createBuffer(new Float32Array(bufferData));
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const clipPositionLoc = gl.getAttribLocation(program, "aClipPosition");
  gl.enableVertexAttribArray(clipPositionLoc);
  gl.vertexAttribPointer(
    clipPositionLoc,
    2,
    gl.FLOAT,
    false,
    ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    0
  );

  const colorLoc = gl.getAttribLocation(program, "aColor");
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(
    colorLoc,
    3,
    gl.FLOAT,
    false,
    ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    2 * BYTES_IN_FLOAT
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // render
  gl.useProgram(program);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, bufferData.length / ELEMENTS_PER_CHUNK);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-buffer-interleaved",
  filename: "23-webgl-buffer-interleaved.tsx",
  name: "WebGL buffer interleaved",
  description:
    "Renders tris from positions directly in clip space from a single buffer of various interleaved attributes.",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "640px" },
  }),
};

export default example;
