import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
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

function getQuadPositions(x: number, y: number, w: number, h: number) {
  const x1 = x;
  const y1 = y;
  const x2 = x1 + w;
  const y2 = y1 + h;
  return new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]);
}

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);

  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  // required for data texture
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  // program
  const program = createProgramForShaders(gl, vertexShader, fragmentShader);

  // resources
  const resources = new WebGLResourceManager(gl);

  // geometry
  const vao = resources.createVertexArray();
  gl.bindVertexArray(vao);

  createAttribute(gl, program, {
    name: "a_position",
    buffer: resources.createBuffer(getQuadPositions(0, 0, WIDTH, HEIGHT)),
    size: 2,
  });

  createAttribute(gl, program, {
    name: "a_texCoord",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ),
    size: 2,
  });

  // textures
  gl.activeTexture(gl.TEXTURE0 + 0);
  const texture = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const data = new Uint8Array([128, 64, 128, 0, 192, 0, 64, 128]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.LUMINANCE,
    4,
    2,
    0,
    gl.LUMINANCE,
    gl.UNSIGNED_BYTE,
    data
  );

  // uniforms
  const uniforms = getUniformLocations(gl, program, [
    "u_resolution",
    "u_image",
  ]);

  // render
  let rafId = 0;
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniform2f(uniforms.u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1i(uniforms.u_image, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    rafId = requestAnimationFrame(render);
  };

  render();

  return () => {
    cancelAnimationFrame(rafId);
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-texture-data",
  filename: "20-webgl-texture-data.tsx",
  name: "WebGL data texture",
  description: "Loading data through a texture",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "320px", imageRendering: "pixelated" },
  }),
};

export default example;
