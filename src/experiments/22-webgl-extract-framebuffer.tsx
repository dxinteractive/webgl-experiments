import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponentWithImages } from "./utils/create-canvas-component";

const WIDTH = 8;
const HEIGHT = 8;

const vertexShader = `#version 300 es

in vec2 a_pos;
out vec2 v_uv;

void main() {
  vec2 clipSpace = (a_pos * 2.0) - 1.0;
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  v_uv = a_pos;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;

in vec2 v_uv;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_uv);
}
`;

function createAndUploadTexture(
  gl: WebGL2RenderingContext,
  resources: WebGLResourceManager,
  image: HTMLImageElement
) {
  const texture = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we don't need mips and so we're not filtering
  // and we don't repeat
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

function setupWebgl(
  canvas: HTMLCanvasElement,
  [image]: HTMLImageElement[]
): () => void {
  const gl = getWebgl2Context(canvas);
  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("No EXT_color_buffer_float");
  }

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

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

  // textures
  const TEXTURE_INDEX = 0;
  gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX);
  const texture = createAndUploadTexture(gl, resources, image);

  gl.bindVertexArray(null);

  // framebuffer
  const framebufferTexture = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA16F,
    // use gl.RGBA8 to draw pixels to gl.UNSIGNED_BYTE,
    // use gl.RGBA##F and EXT_color_buffer_float extension to draw pixels to gl.FLOAT
    WIDTH,
    HEIGHT
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  const framebuffer = resources.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    framebufferTexture,
    0
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // uniforms
  const uniforms = getUniformLocations(gl, program, ["u_image"]);

  gl.useProgram(program);
  gl.uniform1i(uniforms.u_image, TEXTURE_INDEX);

  // render
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindVertexArray(vao);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // if framebuffer is using gl.RGBA8 format
  // const readAsUint = new Uint8Array(WIDTH * HEIGHT * 4);
  // gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, readAsUint);
  // console.log("int values for R G B and A channels, left to right, bottom to top", readAsUint);

  // if framebuffer is using gl.RGBA##F format
  const readAsFloat = new Float32Array(WIDTH * HEIGHT * 4);
  gl.readPixels(0, 0, WIDTH, HEIGHT, gl.RGBA, gl.FLOAT, readAsFloat);
  console.log(
    "float values for R G B and A channels, left to right, bottom to top",
    readAsFloat
  );

  // also draw to canvas
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  gl.bindVertexArray(null);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAE9JREFUKFNtztENgEAMAlAYQvdfTAdwCS6twZSL/bqUl3IEIEn4m5sAKyVZKkyFNQ36MZDDAEYX8hKhZ9ucURdAON7eUfcBh/6pUYM9nGgBCIsyaP7vzX4AAAAASUVORK5CYII=";

const example: ExperimentDefinition = {
  id: "webgl-extract-framebuffer",
  filename: "22-webgl-extract-framebuffer.tsx",
  name: "WebGL extract framebuffer",
  description:
    "Extract data from a framebuffer, logging float values to console",
  Component: createCanvasComponentWithImages(setupWebgl, [IMAGE], {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
