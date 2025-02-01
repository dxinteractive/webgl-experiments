import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const WIDTH = 8;
const HEIGHT = 8;

const vertexShader = `#version 300 es

in vec2 a_pos;
out vec2 v_uv;

void main() {
  gl_Position = vec4((a_pos * 2.0) - 1.0, 0, 1);
  v_uv = a_pos;
}
`;

const fragmentShader = `#version 300 es
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

  // correct gl's flipped y when unpacking texture
  // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // program
  const program = createProgramForShaders(gl, vertexShader, fragmentShader);

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  createAttribute(gl, program, {
    name: "a_pos",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ),
    size: 2,
  });

  gl.bindVertexArray(null);

  // framebuffer
  // const framebufferTexture = resources.createTexture();
  // gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);
  // gl.texStorage2D(
  //   gl.TEXTURE_2D,
  //   1,
  //   gl.RGBA16F,
  //   // use gl.RGBA8 to draw pixels to gl.UNSIGNED_BYTE,
  //   // use gl.RGBA##F and EXT_color_buffer_float extension to draw pixels to gl.FLOAT
  //   WIDTH,
  //   HEIGHT
  // );
  // gl.bindTexture(gl.TEXTURE_2D, null);

  // const framebuffer = resources.createFramebuffer();
  // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  // gl.framebufferTexture2D(
  //   gl.FRAMEBUFFER,
  //   gl.COLOR_ATTACHMENT0,
  //   gl.TEXTURE_2D,
  //   framebufferTexture,
  //   0
  // );
  // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  gl.useProgram(program);

  // render
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindVertexArray(vao);

  // also draw to canvas
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-framebuffer-bouncing",
  filename: "28-webgl-framebuffer-bouncing.tsx",
  name: "WebGL framebuffer bouncing (unfinished)",
  description: "Renders to and framebuffers repeatedly",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
