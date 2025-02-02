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

const quadVertexShader = `#version 300 es

in vec2 a_pos;
out vec2 v_uv;

void main() {
  gl_Position = vec4((a_pos * 2.0) - 1.0, 0, 1);
  v_uv = a_pos;
}
`;

const gradientFragmentShader = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

void main() {
  outColor = vec4(v_uv.x, 0.0, v_uv.y, 1.0);
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

const tileFragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;

in vec2 v_uv;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_uv * 2.0);
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
  const gradientProgram = createProgramForShaders(
    gl,
    quadVertexShader,
    gradientFragmentShader
  );

  const hueCycleProgram = createProgramForShaders(
    gl,
    quadVertexShader,
    hueCycleFragmentShader
  );

  const tileProgram = createProgramForShaders(
    gl,
    quadVertexShader,
    tileFragmentShader
  );

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  createAttribute(gl, gradientProgram, {
    name: "a_pos",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ),
    size: 2,
  });

  // framebuffer textures
  const framebufferTexture1 = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture1);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, 8, 8);

  const framebufferTexture2 = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture2);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, 8, 8);

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
  gl.useProgram(gradientProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
  renderQuad();

  // render framebuffer1 > hue cycle > framebuffer2
  gl.useProgram(hueCycleProgram);
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
  renderQuad();

  // render framebuffer2 > hue cycle > framebuffer1
  gl.useProgram(hueCycleProgram);
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture2);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
  renderQuad();

  // render framebuffer2 > tile > out
  gl.useProgram(tileProgram);
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture1);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  renderQuad();

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-framebuffer-bouncing",
  filename: "28-webgl-framebuffer-bouncing.tsx",
  name: "WebGL framebuffer bouncing",
  description: "Renders to and framebuffers repeatedly",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
