import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";
import vertexShaderSource from "./15-vertex-shader.glsl?raw";
import fragmentShaderSource from "./15-fragment-shader.glsl?raw";
import { unbindAll } from "./utils/webgl-utils";

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${log}`);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);

    throw new Error(`program linking error: ${log}`);
  }

  return program;
}

function createProgramForShaders(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  return createProgram(gl, vertexShader, fragmentShader);
}

function updateCanvasSize(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("gl not supported");
  }

  updateCanvasSize(canvas, gl);

  const program = createProgramForShaders(
    gl,
    vertexShaderSource,
    fragmentShaderSource
  );
  gl.useProgram(program);

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    throw new Error("gl.createBuffer() failed");
  }

  const vertexData = new Float32Array([
    0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0,
  ]);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const vertexArray = gl.createVertexArray();
  if (!vertexArray) {
    throw new Error("Failed to create VAO");
  }

  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  const positionAttributeLocation = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Tell WebGL how to read the data from our buffer:
  // - 3 numbers per vertex
  // - Those numbers are floats
  // - Don't normalize the data
  // - Each set of 3 numbers is 3 floats * 4 bytes per float = 12 bytes away
  //   from the previous one
  // - Start reading from the beginning of the buffer (offset 0)
  gl.vertexAttribPointer(
    positionAttributeLocation,
    3,
    gl.FLOAT,
    false,
    3 * 4,
    0
  );

  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const timeUniformLocation = gl.getUniformLocation(program, "u_time");
  gl.uniform1f(timeUniformLocation, 0);

  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  const startTime = Date.now();

  //
  // render
  //

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

function Component() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) {
      return;
    }
    return setupWebgl(canvas);
  }, []);

  return <canvas ref={ref} style={{ height: "640px" }} />;
}

const example: ExperimentDefinition = {
  id: "webgl-setup",
  filename: "15-webgl-setup.tsx",
  name: "WebGL setup",
  description: "Hello world for WebGL2.",
  Component,
};

export default example;
