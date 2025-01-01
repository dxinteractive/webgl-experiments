import type { ExperimentDefinition } from "../types";
import {
  createBuffer,
  createProgramForShaders,
  createVertexArray,
  getWebgl2Context,
  unbindAll,
  updateCanvasSize,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const vertexShader = `#version 300 es

precision highp float;

layout (location = 0) in vec3 aPosition;

uniform float u_time;

out vec2 uv;

void main() {
  float wave = sin(u_time * 0.005) * 0.1;
  vec3 p = aPosition + vec3(0.0, wave, 0.0);
  gl_Position = vec4(p, 1.0);
  uv = aPosition.xy * vec2(0.5, 0.5);
}
`;

const fragmentShader = `#version 300 es

precision highp float;

uniform float u_time;

in vec2 uv;
out vec4 outColor;

void main() {
  float wave = sin(u_time * 0.005) * 0.5 + 0.5;
  outColor = vec4(uv.x, 0.2, uv.y + wave, 1.0);
}
`;

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);
  updateCanvasSize(canvas, gl);

  const program = createProgramForShaders(gl, vertexShader, fragmentShader);
  gl.useProgram(program);

  const vertexBuffer = createBuffer(gl);
  const vertexData = new Float32Array([
    0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0,
  ]);
  const vertexArray = createVertexArray(gl);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bindVertexArray(vertexArray);

  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

  const positionAttributeLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.vertexAttribPointer(
    positionAttributeLocation,
    3, //  3 numbers per vertex
    gl.FLOAT, // Those numbers are floats
    false, // Don't normalize the data
    3 * 4, // Each set of 3 numbers is 3 floats * 4 bytes per float = 12 bytes away from the previous one
    0 // Start reading from the beginning of the buffer (offset 0)
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  const timeUniformLocation = gl.getUniformLocation(program, "u_time");
  gl.uniform1f(timeUniformLocation, 0);

  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  const startTime = Date.now();

  let rafId = 0;
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniform1f(timeUniformLocation, Date.now() - startTime);

    gl.bindVertexArray(vertexArray);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    rafId = requestAnimationFrame(render);
  };

  render();

  return () => {
    cancelAnimationFrame(rafId);
    unbindAll(gl);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteVertexArray(vertexArray);
  };
}

const example: ExperimentDefinition = {
  id: "webgl-setup-streamlined",
  filename: "16-webgl-setup-streamlined.tsx",
  name: "WebGL setup streamlined",
  description:
    "Hello world for WebGL2 with reduced boilerplate using utility functions.",
  Component: createCanvasComponent(setupWebgl, { style: { height: "640px" } }),
};

export default example;
