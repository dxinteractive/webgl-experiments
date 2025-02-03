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
  images: HTMLImageElement[]
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

  gl.bindVertexArray(null);

  // textures
  gl.activeTexture(gl.TEXTURE0);
  const textures = images.map((image) =>
    uploadTexture(gl, resources.createTexture(), image, { nearest: true })
  );

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, ["u_image"]);
  gl.uniform1i(uniforms.u_image, 0);

  // render
  let rafId = 0;
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    const textureIndex = Math.floor(Date.now() * 0.001) % images.length;

    gl.bindVertexArray(vao);
    gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    rafId = requestAnimationFrame(render);
  };

  render();

  return () => {
    cancelAnimationFrame(rafId);
    unbindAll(gl);
    resources.deleteAll();
  };
}

const IMAGES = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAE9JREFUKFNtztENgEAMAlAYQvdfTAdwCS6twZSL/bqUl3IEIEn4m5sAKyVZKkyFNQ36MZDDAEYX8hKhZ9ucURdAON7eUfcBh/6pUYM9nGgBCIsyaP7vzX4AAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAF5JREFUKFNdj8ENwCAMA88j0HXbJ123HcFVQAGKHyhKLnaQKwbQFW9X6a0mJcA5m20gNVCAbcMtdugQCxBrGxQu0yFDF6gBBfv5xw+nAbwoDpnfyLg4NhxyEmDKtVcfQkIsN/jTJ+0AAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAEBJREFUKFNjZEACZxjO/AdxTRhMGGHCcAZIUtFaESx+/+h9uCKwAmRJmE6YIkZsksiKCCsgaAXMOLyORFaE7k0ATz4pNzaQotYAAAAASUVORK5CYII=",
];

const example: ExperimentDefinition = {
  id: "webgl-texture-streamlined",
  filename: "19-webgl-texture-streamlined.tsx",
  name: "WebGL texture streamlined",
  description: "Load and render a texture with WebGL2 simplified a bit",
  Component: createCanvasComponentWithImages(setupWebgl, IMAGES, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
