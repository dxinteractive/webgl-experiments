import type { ExperimentDefinition } from "../types";
import {
  createBuffer,
  createProgramForShaders,
  createTexture,
  createVertexArray,
  getWebgl2Context,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const vertexShader = `#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_resolution;

out vec2 v_texCoord;

void main() {
  vec2 unitSpace = a_position / u_resolution;
  vec2 clipSpace = (unitSpace * 2.0) - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

  // pass the texCoord to the fragment shader
  // The GPU will interpolate this value between points.
  v_texCoord = a_texCoord;
}
`;

// vec2 onePixel = vec2(1) / vec2(textureSize(u_image, 0));
// outColor = texture(u_image, v_texCoord).bgra;

const fragmentShader = `#version 300 es
precision highp float;

uniform sampler2D u_image;

in vec2 v_texCoord;
out vec4 outColor;

void main() {
  outColor = texture(u_image, v_texCoord);
}
`;

const IMAGES = [
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAE9JREFUKFNtztENgEAMAlAYQvdfTAdwCS6twZSL/bqUl3IEIEn4m5sAKyVZKkyFNQ36MZDDAEYX8hKhZ9ucURdAON7eUfcBh/6pUYM9nGgBCIsyaP7vzX4AAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAF5JREFUKFNdj8ENwCAMA88j0HXbJ123HcFVQAGKHyhKLnaQKwbQFW9X6a0mJcA5m20gNVCAbcMtdugQCxBrGxQu0yFDF6gBBfv5xw+nAbwoDpnfyLg4NhxyEmDKtVcfQkIsN/jTJ+0AAAAASUVORK5CYII=",
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAEBJREFUKFNjZEACZxjO/AdxTRhMGGHCcAZIUtFaESx+/+h9uCKwAmRJmE6YIkZsksiKCCsgaAXMOLyORFaE7k0ATz4pNzaQotYAAAAASUVORK5CYII=",
];

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve(image);
  });
}

function createAndUploadTexture(
  gl: WebGL2RenderingContext,
  image: HTMLImageElement
) {
  const texture = createTexture(gl);
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

function setupWebglWithImages(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[]
): () => void {
  const gl = getWebgl2Context(canvas);

  canvas.width = 8;
  canvas.height = 8;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  const program = createProgramForShaders(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");

  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const imageLocation = gl.getUniformLocation(program, "u_image");

  const vao = createVertexArray(gl);
  gl.bindVertexArray(vao);

  const positionBuffer = createBuffer(gl);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const texCoordBuffer = createBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.STATIC_DRAW
  );

  gl.enableVertexAttribArray(texCoordAttributeLocation);
  gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  gl.activeTexture(gl.TEXTURE0 + 0);
  const textures = images.map((image) => createAndUploadTexture(gl, image));

  let rafId = 0;
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(imageLocation, 0);

    const x1 = 0;
    const y1 = 0;
    const x2 = x1 + 8; // image width
    const y2 = y1 + 8;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
      gl.STATIC_DRAW
    );
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindVertexArray(vao);
    const textureIndex = Math.floor(Date.now() * 0.001) % images.length;
    gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    rafId = requestAnimationFrame(render);
  };

  render();

  return () => {
    cancelAnimationFrame(rafId);
  };
}

function setupWebgl(canvas: HTMLCanvasElement) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let cleanup = () => {};

  Promise.all(IMAGES.map((img) => loadImage(img))).then(
    (images: HTMLImageElement[]) => {
      cleanup = setupWebglWithImages(canvas, images);
    }
  );

  return () => cleanup();
}

const example: ExperimentDefinition = {
  id: "webgl-texture",
  filename: "17-webgl-texture.tsx",
  name: "WebGL texture",
  description:
    "Load and render a texture with WebGL2, based off https://webgl2fundamentals.org/webgl/lessons/webgl-image-processing.html",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
