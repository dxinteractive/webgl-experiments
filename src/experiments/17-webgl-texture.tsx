import type { ExperimentDefinition } from "../types";
import {
  createBuffer,
  createProgramForShaders,
  createTexture,
  createVertexArray,
  getWebgl2Context,
  unbindAll,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const WIDTH = 8;
const HEIGHT = 8;

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

function getQuadPositions(x: number, y: number, w: number, h: number) {
  const x1 = x;
  const y1 = y;
  const x2 = x1 + w;
  const y2 = y1 + h;
  return new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
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

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // program
  const program = createProgramForShaders(gl, vertexShader, fragmentShader);

  // geometry
  const vao = createVertexArray(gl);
  gl.bindVertexArray(vao);

  const positionBuffer = createBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    getQuadPositions(0, 0, WIDTH, HEIGHT),
    gl.STATIC_DRAW
  );

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  const texCoordBuffer = createBuffer(gl);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
    gl.STATIC_DRAW
  );

  const texCoordAttributeLocation = gl.getAttribLocation(program, "a_texCoord");
  gl.enableVertexAttribArray(texCoordAttributeLocation);
  gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  // textures
  const TEXTURE_INDEX = 0;
  gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX);
  const textures = images.map((image) => createAndUploadTexture(gl, image));

  // uniforms
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const imageLocation = gl.getUniformLocation(program, "u_image");

  let rafId = 0;
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(imageLocation, TEXTURE_INDEX);

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
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(texCoordBuffer);
    gl.deleteVertexArray(vao);
    for (const texture of textures) {
      gl.deleteTexture(texture);
    }
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