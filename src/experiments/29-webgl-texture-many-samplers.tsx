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

const WIDTH = 64;
const HEIGHT = 64;

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

uniform sampler2D u_image1;
uniform sampler2D u_image2;
uniform sampler2D u_image3;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec4 s1 = texture(u_image1, v_uv);
  vec4 s2 = texture(u_image2, v_uv);
  vec4 s3 = texture(u_image3, v_uv);
  vec4 s12mix = mix(s1, s2, v_uv.x);
  outColor = mix(s12mix, s3, v_uv.y);
}
`;

function createUploadAndBindTexture(
  gl: WebGL2RenderingContext,
  resources: WebGLResourceManager,
  image: HTMLImageElement,
  slot: GLenum
) {
  gl.activeTexture(slot);

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

  // bind the texture ready for rendering
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

function setupWebgl(
  canvas: HTMLCanvasElement,
  [image1, image2, image3]: HTMLImageElement[]
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
  createUploadAndBindTexture(gl, resources, image1, gl.TEXTURE0);
  createUploadAndBindTexture(gl, resources, image2, gl.TEXTURE1);
  createUploadAndBindTexture(gl, resources, image3, gl.TEXTURE2);

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, [
    "u_image1",
    "u_image2",
    "u_image3",
  ]);
  gl.uniform1i(uniforms.u_image1, 0);
  gl.uniform1i(uniforms.u_image2, 1);
  gl.uniform1i(uniforms.u_image3, 2);

  // render
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return () => {
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
  id: "webgl-texture-many-samplers",
  filename: "29-webgl-texture-many-samplers.tsx",
  name: "WebGL texture many samplers",
  description:
    "Load and render a combination of 3 textures in the same frag shader",
  Component: createCanvasComponentWithImages(setupWebgl, IMAGES, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
