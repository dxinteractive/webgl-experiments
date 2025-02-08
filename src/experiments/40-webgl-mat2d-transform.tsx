import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { useEffect, useRef } from "react";
import { mat2d, vec2 } from "gl-matrix";

const vertexShader = `#version 300 es
precision highp float;

uniform vec2 u_resolution;

in mat3 a_matrix;
in vec3 a_color;
in vec2 a_vertexPos;
out vec3 v_color;

void main() {
  vec3 pos = a_matrix * vec3(a_vertexPos, 1.);
  vec3 pos2 = pos / vec3(u_resolution, 1.) * 2.;
  vec3 clip = vec3(pos2.x - 1., 1. - pos2.y, pos2.z);
  gl_Position = vec4(clip.xy, 0., 1.);
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

const WIDTH = 640;
const HEIGHT = 320;

const TRIANGLE_VERTICES = [0, 0, WIDTH * 0.1, 0, 0, HEIGHT * 0.1];

type TransformData = {
  m: mat2d;
  rgb: [number, number, number];
};

const identity = mat2d.create();

const TRANSFORM_EXAMPLES: TransformData[] = [
  { m: mat2d.clone(identity), rgb: [1, 1, 1] },
  {
    m: mat2d.multiplyScalar(mat2d.create(), identity, 0.5),
    rgb: [1, 0, 0],
  },
  {
    m: mat2d.translate(mat2d.create(), identity, vec2.fromValues(100, 50)),
    rgb: [0, 0.5, 0],
  },
  {
    m: mat2d.rotate(mat2d.create(), identity, Math.PI / 3),
    rgb: [0.3, 0.3, 1],
  },
];

function setupWebgl(
  canvasgl: HTMLCanvasElement,
  canvas2d: HTMLCanvasElement
): () => void {
  const gl = getWebgl2Context(canvasgl);
  const ctx = canvas2d.getContext("2d");
  if (!ctx) {
    throw new Error("no 2d ctx");
  }

  canvasgl.width = WIDTH;
  canvasgl.height = HEIGHT;
  canvas2d.width = WIDTH;
  canvas2d.height = HEIGHT;
  gl.viewport(0, 0, canvasgl.width, canvasgl.height);

  // render 2d
  for (const { m, rgb } of TRANSFORM_EXAMPLES) {
    ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
    ctx.fillStyle = `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`;
    ctx.beginPath();

    const t = TRIANGLE_VERTICES;
    ctx.moveTo(t[0], t[1]);
    ctx.lineTo(t[2], t[3]);
    ctx.lineTo(t[4], t[5]);
    ctx.fill();
  }

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
    buffer: resources.createBuffer(new Float32Array(TRIANGLE_VERTICES)),
    size: 2,
  });

  // data specific to each instance - matrix and color
  const bufferData: number[] = [];
  for (const { m, rgb } of TRANSFORM_EXAMPLES) {
    bufferData.push(m[0], m[1], 0, m[2], m[3], 0, m[4], m[5], 1, ...rgb);
  }

  console.log("bufferData", bufferData);

  const buffer = resources.createBuffer(new Float32Array(bufferData));

  // using utility function:

  const ELEMENTS_PER_CHUNK = 12;
  const BYTES_IN_FLOAT = 4;

  createAttribute(gl, program, {
    name: "a_matrix",
    buffer,
    size: 3,
    matrixSize: 3,
    stride: ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    instanced: true,
  });

  createAttribute(gl, program, {
    name: "a_color",
    buffer,
    size: 3,
    stride: ELEMENTS_PER_CHUNK * BYTES_IN_FLOAT,
    offset: 9 * BYTES_IN_FLOAT,
    instanced: true,
  });

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, ["u_resolution"], true);
  gl.uniform2f(uniforms.u_resolution, WIDTH, HEIGHT);

  // render
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

function Component() {
  const refgl = useRef<HTMLCanvasElement | null>(null);
  const ref2d = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasgl = refgl.current;
    const canvas2d = ref2d.current;
    if (!canvasgl || !canvas2d) {
      return;
    }
    return setupWebgl(canvasgl, canvas2d);
  }, []);

  return (
    <div>
      <canvas
        ref={ref2d}
        style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
      />
      <canvas
        ref={refgl}
        style={{ width: `${WIDTH}px`, height: `${HEIGHT}px` }}
      />
    </div>
  );
}

const example: ExperimentDefinition = {
  id: "webgl-mat2d-transform",
  filename: "40-webgl-mat2d-transform.tsx",
  name: "WebGL mat2d transform like 2d canvas ctx",
  description:
    "Replicate canvas 2d's mat2d transform in WebGL. Also uses createAttribute() matrixSize to set multiple attribute locations to enable the use of mat data types with instancing",
  Component,
};

export default example;
