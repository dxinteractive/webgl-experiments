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

in vec2 a_pos;
in vec3 a_color;
out vec3 v_color;

void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
  v_color = a_color;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 outColor;

void main() {
  outColor = vec4(v_color, 1.0);
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

  const bufferData = new Float32Array([
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
  ]);

  const buffer = resources.createBuffer(bufferData);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const clipPositionLoc = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(clipPositionLoc);
  gl.vertexAttribPointer(
    clipPositionLoc,
    2,
    gl.FLOAT,
    false,
    ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    0
  );

  const colorLoc = gl.getAttribLocation(program, "a_color");
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

  const indexesToUpdate = [15, 20, 25];

  setInterval(() => {
    for (const index of indexesToUpdate) {
      bufferData[index] += 0.01;
    }

    // push everything from index 15-29 into GPU again
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      BYTES_IN_FLOAT * indexesToUpdate[0],
      bufferData,
      indexesToUpdate[0],
      indexesToUpdate.length * ELEMENTS_PER_CHUNK
    );

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, bufferData.length / ELEMENTS_PER_CHUNK);
  }, 50);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-buffer-suub-data",
  filename: "44-webgl-buffer-sub-data.tsx",
  name: "WebGL bufferSubData",
  description: "Partial update of a buffer using bufferSubData()",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "640px" },
  }),
};

export default example;
