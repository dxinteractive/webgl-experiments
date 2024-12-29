import { useEffect, useRef } from "react";
import type { ExperimentDefinition } from "../types";
import vertexShaderSource from "./15-vertex-shader.glsl?raw";
import fragmentShaderSource from "./15-fragment-shader.glsl?raw";

export function compileShader(
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

export function createProgram(
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

export function setupShaders(
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

  // Update WebGL viewport to match new canvas size
  gl.viewport(0, 0, canvas.width, canvas.height);

  // // Recalculate projection matrix with new aspect ratio
  // mat4.perspective(
  //   this.matrices.projection,
  //   Math.PI / 4,
  //   canvas.width / canvas.height,
  //   0.1,
  //   100
  // );

  // // Update projection matrix in the shader
  // if (this.matrixLocations.projection) {
  //   gl.uniformMatrix4fv(
  //     this.matrixLocations.projection,
  //     false,
  //     this.matrices.projection
  //   );
  // }
}

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("gl not supported");
  }

  updateCanvasSize(canvas, gl);

  const vertexData = new Float32Array([
    0.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0,
  ]);

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    throw new Error("gl.createBuffer() failed");
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const program = setupShaders(gl, vertexShaderSource, fragmentShaderSource);
  gl.useProgram(program);

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

  //
  // render
  //

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // update matrices in gl
  //  gl.uniformMatrix4fv(this.matrixLocations.model, false, this.matrices.model);
  //  gl.uniformMatrix4fv(this.matrixLocations.view, false, this.matrices.view);

  gl.bindVertexArray(vertexArray);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);

  return () => {
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
