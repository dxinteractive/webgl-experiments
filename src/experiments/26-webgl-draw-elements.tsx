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

  const elementVertexData = [
    // pos 0
    0, 0,
    // color 0
    0, 0, 0,
    // pos 1
    0.3, 0,
    // color 1
    1, 0, 0,
    // pos 2
    0.6, 0,
    // color 2
    0, 1, 0,
    // pos 3
    0, 0.3,
    // color 3
    0, 0, 1,
    // pos 4
    0.3, 0.3,
    // color 4
    1, 1, 0,
    // pos 5
    0.6, 0.3,
    // color 5
    0, 1, 1,
  ];

  const elementIndexData = [
    // face 1
    0, 1, 3,
    // face 2
    3, 1, 4,
    // face 3
    1, 2, 4,
    // face 4
    2, 4, 5,
  ];

  const elementVertexBuffer = resources.createBuffer(
    new Float32Array(elementVertexData)
  );

  const ELEMENTS_PER_CHUNK = 5;
  const BYTES_IN_FLOAT = 4;

  createAttribute(gl, program, {
    name: "a_pos",
    buffer: elementVertexBuffer,
    size: 2,
    stride: ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
  });

  createAttribute(gl, program, {
    name: "a_color",
    buffer: elementVertexBuffer,
    size: 3,
    stride: ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    offset: 2 * BYTES_IN_FLOAT,
  });

  const elementIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementIndexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint8Array(elementIndexData),
    gl.STATIC_DRAW
  );

  // render
  gl.useProgram(program);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, elementIndexData.length, gl.UNSIGNED_BYTE, 0);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-draw-elements",
  filename: "26-webgl-draw-elements.tsx",
  name: "WebGL elements mesh",
  description: "Renders a mesh using drawElements()",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "640px" },
  }),
};

export default example;
