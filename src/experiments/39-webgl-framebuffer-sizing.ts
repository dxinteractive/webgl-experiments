import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const WIDTH = 64;
const HEIGHT = 64;

const FRAMEBUFFER_WIDTH = 1024;
const FRAMEBUFFER_HEIGHT = 1024;

const quadVertexShader = `#version 300 es

in vec2 a_pos;
out vec2 v_uv;

void main() {
  gl_Position = vec4((a_pos * 2.0) - 1.0, 0, 1);
  v_uv = a_pos;
}
`;

const noiseFragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

void main() {
  float r = fract(sin(v_uv.x + v_uv.y * 3.7) * 999999.9);
  float l = 0.;
  if(r > 0.5) {
    l = 1.;
  }
  outColor = vec4(l, l, l, 1.0); // only white or black pixels
}
`;

const hueCycleFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec4 sampled = texture(u_image, v_uv);
  outColor = vec4(sampled.g, sampled.b, sampled.r, 1.0);
}
`;

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("No EXT_color_buffer_float");
  }

  // programs
  const noiseProgram = createProgramForShaders(
    gl,
    quadVertexShader,
    noiseFragmentShader
  );

  const hueCycleProgram = createProgramForShaders(
    gl,
    quadVertexShader,
    hueCycleFragmentShader
  );

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  createAttribute(gl, noiseProgram, {
    name: "a_pos",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ),
    size: 2,
  });

  // framebuffer textures
  const framebufferTexture1 = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA16F,
    FRAMEBUFFER_WIDTH,
    FRAMEBUFFER_HEIGHT
  );

  const framebufferTexture2 = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture2);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, WIDTH, HEIGHT);

  gl.bindTexture(gl.TEXTURE_2D, null);

  // framebuffers
  const framebuffer1 = resources.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    framebufferTexture1,
    0
  );

  const framebuffer2 = resources.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    framebufferTexture2,
    0
  );

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // set up rendering
  const renderQuad = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  // render quad to framebuffer1
  gl.useProgram(noiseProgram);
  gl.viewport(0, 0, FRAMEBUFFER_WIDTH, FRAMEBUFFER_HEIGHT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
  renderQuad();

  // render framebuffer1 > hue cycle > canvas
  gl.useProgram(hueCycleProgram);
  gl.viewport(0, 0, WIDTH, HEIGHT);
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  renderQuad();

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-framebuffer-sizing",
  filename: "39-webgl-framebuffer-sizing.tsx",
  name: "WebGL framebuffer sizing",
  description:
    "Renders to a framebuffer of a different size to the canvas. Grey pixels show that the framebuffer was rendered at a higher resolution and downsampled for rendering to the canvas.",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: `${HEIGHT * 3}px`, imageRendering: "pixelated" },
  }),
};

export default example;
