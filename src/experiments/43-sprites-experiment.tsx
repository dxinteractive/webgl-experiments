import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  updateCanvasSize,
  uploadTexture,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponentWithImages } from "./utils/create-canvas-component";

const vertexShader = `#version 300 es
precision highp float;

in vec2 a_pos;
in vec3 a_color;
in vec2 a_vertexPos;
out vec2 v_uv;
out vec3 v_color;

void main() {
  gl_Position = vec4(a_pos + (a_vertexPos * .8), 0.0, 1.0);
  v_uv = a_vertexPos;
  v_color = a_color;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;

in vec2 v_uv;
in vec3 v_color;

out vec4 outColor;

void main() {
  outColor = vec4(v_color, texture(u_image, v_uv).r);
}
`;

function setupWebgl(
  canvas: HTMLCanvasElement,
  [image]: HTMLImageElement[]
): () => void {
  const gl = getWebgl2Context(canvas);
  updateCanvasSize(canvas, gl);

  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // alpha blending setup
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // program
  const program = createProgramForShaders(gl, vertexShader, fragmentShader);

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  // data common to all instances - vertex local offsets
  const VERTEX_COUNT = 6;

  createAttribute(gl, program, {
    name: "a_vertexPos",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1])
    ),
    size: 2,
  });

  // texture
  const texture = uploadTexture(gl, resources.createTexture(), image, {
    nearest: true,
  });

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, ["u_image"]);
  gl.uniform1i(uniforms.u_image, 0);

  // data specific to each instance - position and color
  const bufferData = [
    // sprite 1
    //   position
    -0.9, 0.1,
    //   color
    1, 1, 0,
    // sprite 2
    //   position
    -0.8, 0,
    //   color
    0, 1, 1,
    // sprite 3
    //   position
    -0.7, -0.1,
    //   color
    1, 0, 1,
    // sprite 4
    //   position
    -0.65, -0.15,
    //   color
    1, 1, 0,
    // sprite 5
    //   position
    -0.7, -0.2,
    //   color
    0, 1, 1,
    // sprite 6
    //   position
    -0.75, -0.25,
    //   color
    1, 0, 1,
  ];

  const buffer = resources.createBuffer(new Float32Array(bufferData));

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
  gl.bindTexture(gl.TEXTURE_2D, texture);

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

const IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJCAYAAADgkQYQAAAAAXNSR0IArs4c6QAAAGBJREFUKFOVkEsNwEAIRAczawADqwZPoAYDGMBMGzalSQ9tuhzhZT4QgAPXiAiYGREBM+s1aAtqlTEGMvOhRiKy7MqmgDkn3P0G60aquqAGOkiDC/ql1ME/M221K++3P51AL08w00t2+wAAAABJRU5ErkJggg==";

const example: ExperimentDefinition = {
  id: "sprites-experiment",
  filename: "43-sprites-experiment.tsx",
  name: "Sprites experiment",
  description:
    "Renders many transparent textured sprites on top of each other. Uses instancing.",
  Component: createCanvasComponentWithImages(setupWebgl, [IMAGE], {
    style: { height: "640px" },
  }),
};

export default example;
