import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
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
in vec2 a_vertexPos;
out vec3 v_color;

void main() {
  gl_Position = vec4(a_pos + a_vertexPos, 0.0, 1.0);
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

  // data common to all instances - vertex local offsets
  const VERTEX_COUNT = 3;

  createAttribute(gl, program, {
    name: "a_vertexPos",
    buffer: resources.createBuffer(
      new Float32Array([
        // vertex 1
        0, 0,
        // vertex 2
        -0.2, -0.4,
        // vertex 3
        0.2, -0.4,
      ])
    ),
    size: 2,
  });

  // data specific to each instance - position and color
  const bufferData = [
    // triangle 1
    //   position
    -0.7, 0.9,
    //   color
    1, 1, 0,
    // triangle 2
    //   position
    0, 0.2,
    //   color
    0, 1, 1,
    // triangle 3
    //   position
    0.7, -0.5,
    //   color
    1, 0, 1,
  ];

  const buffer = resources.createBuffer(new Float32Array(bufferData));

  // directly:
  // gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // const clipPositionLoc = gl.getAttribLocation(program, "a_pos");
  // gl.enableVertexAttribArray(clipPositionLoc);
  // gl.vertexAttribPointer(
  //   clipPositionLoc,
  //   2,
  //   gl.FLOAT,
  //   false,
  //   ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
  //   0
  // );

  // const colorLoc = gl.getAttribLocation(program, "a_color");
  // gl.enableVertexAttribArray(colorLoc);
  // gl.vertexAttribPointer(
  //   colorLoc,
  //   3,
  //   gl.FLOAT,
  //   false,
  //   ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
  //   2 * BYTES_IN_FLOAT
  // );

  // // instancing
  // gl.vertexAttribDivisor(clipPositionLoc, 1);
  // gl.vertexAttribDivisor(colorLoc, 1);

  // using utility function:

  const ELEMENTS_PER_CHUNK = 5;
  const BYTES_IN_FLOAT = 4;

  createAttribute(gl, program, {
    name: "a_pos",
    buffer,
    size: 2,
    stride: ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    instanced: true,
  });

  createAttribute(gl, program, {
    name: "a_color",
    buffer,
    size: 3,
    stride: ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    offset: 2 * BYTES_IN_FLOAT,
    instanced: true,
  });

  // render
  gl.useProgram(program);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArraysInstanced(
    gl.TRIANGLES,
    0,
    VERTEX_COUNT,
    bufferData.length / ELEMENTS_PER_CHUNK
  );

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-instancing",
  filename: "24-webgl-instancing.tsx",
  name: "WebGL buffer instancing",
  description: "Renders instanced triangles.",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "640px" },
  }),
};

export default example;
