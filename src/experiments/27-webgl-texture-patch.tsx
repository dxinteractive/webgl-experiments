import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  uploadTexture,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponentWithImages } from "./utils/create-canvas-component";

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

uniform sampler2D u_image;

in vec2 v_uv;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_uv);
}
`;

function setupWebgl(
  canvas: HTMLCanvasElement,
  [image1, image2]: HTMLImageElement[]
): () => void {
  const gl = getWebgl2Context(canvas);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // correct gl's flipped y when unpacking texture
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

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
  const texture = uploadTexture(gl, resources.createTexture(), image1, {
    nearest: true,
  });

  gl.bindVertexArray(null);

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, ["u_image"]);
  gl.uniform1i(uniforms.u_image, TEXTURE_INDEX);

  // patch
  const patch = () => {
    const x = 2; // position to patch from left
    const y = 3; // position to patch from top
    const w = 4; // width to patch
    const h = 4; // height to patch
    const xo = 0; // starting pixel from left inside patched region
    const yo = 0; // starting pixel from top inside patched region

    gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, xo);
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, HEIGHT - h - yo);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, w);

    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      x,
      HEIGHT - h - y,
      w,
      h,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image2
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  // render
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(vao);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  render();
  setTimeout(() => {
    patch();
    render();
  }, 500);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const IMAGES = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAE9JREFUKFNtztENgEAMAlAYQvdfTAdwCS6twZSL/bqUl3IEIEn4m5sAKyVZKkyFNQ36MZDDAEYX8hKhZ9ucURdAON7eUfcBh/6pUYM9nGgBCIsyaP7vzX4AAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAEBJREFUKFNjZEACZxjO/AdxTRhMGGHCcAZIUtFaESx+/+h9uCKwAmRJmE6YIkZsksiKCCsgaAXMOLyORFaE7k0ATz4pNzaQotYAAAAASUVORK5CYII=",
];

const example: ExperimentDefinition = {
  id: "webgl-texture-patch",
  filename: "27-webgl-texture-patch.tsx",
  name: "WebGL texture patch",
  description:
    "Load and render a texture with WebGL2, then patch a subset of pixels",
  Component: createCanvasComponentWithImages(setupWebgl, IMAGES, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
