import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  updateCanvasSize,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { createCanvasComponent } from "./utils/create-canvas-component";

const vertexShader = `#version 300 es
precision highp float;

uniform highp sampler2D u_dataTexture;

in vec2 a_pos;
in int a_triangleIndex;
 
vec4 getTexel(sampler2D tex, int index) {
  int texWidth = textureSize(tex, 0).x;
  int col = index % texWidth;
  int row = index / texWidth;
  return texelFetch(tex, ivec2(col, row), 0);
}

void main() {
  vec4 data = getTexel(u_dataTexture, a_triangleIndex);
  gl_Position = vec4(a_pos.x, a_pos.y + data.x, 0.0, 1.0);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

out vec4 outColor;

void main() {
  outColor = vec4(0.5, 0.9, 0.9, 1.0);
}
`;

function createClipSpaceTriangleAt(x: number, y: number) {
  return [x, y, x + 0.03, y - 0.1, x - 0.03, y - 0.1];
}

const VERTICES: number[] = [];
const TRIANGLE_INDICES: number[] = [];
const POSITION_OFFSETS: number[] = [];

let i = 0;
for (let x = -1; x < 1; x += 0.1) {
  VERTICES.push(...createClipSpaceTriangleAt(x, 0));
  TRIANGLE_INDICES.push(i, i, i);
  POSITION_OFFSETS.push(x * x * x, 0, 0, 0);
  i++;
}

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    throw new Error("No EXT_color_buffer_float");
  }
  if (!gl.getExtension("OES_texture_float_linear")) {
    throw new Error("No OES_texture_float_linear");
  }

  updateCanvasSize(canvas, gl);

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
    name: "a_pos",
    buffer: resources.createBuffer(new Float32Array(VERTICES)),
    size: 2,
  });

  const triangleIndexLoc = gl.getAttribLocation(program, "a_triangleIndex");
  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    resources.createBuffer(new Int32Array(TRIANGLE_INDICES))
  );
  gl.enableVertexAttribArray(triangleIndexLoc);
  gl.vertexAttribIPointer(triangleIndexLoc, 1, gl.INT, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // textures
  const TEXTURE_INDEX = 0;
  gl.activeTexture(gl.TEXTURE0 + TEXTURE_INDEX);
  const dataTexture = resources.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, dataTexture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA32F, // to use floats
    POSITION_OFFSETS.length / 4, // width
    1, // height
    0, // border
    gl.RGBA, // format
    gl.FLOAT, // type
    new Float32Array(POSITION_OFFSETS)
  );

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, ["u_dataTexture"]);
  gl.uniform1i(uniforms.u_dataTexture, TEXTURE_INDEX);

  // render
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, VERTICES.length / 2);

  return () => {
    unbindAll(gl);
    resources.deleteAll();
  };
}

const example: ExperimentDefinition = {
  id: "webgl-texture-floats",
  filename: "21-webgl-texture-data-floats.tsx",
  name: "WebGL texture floats",
  description:
    "Renders tris from positions directly in clip space, then offsets them according to float data passed through a texture.",
  Component: createCanvasComponent(setupWebgl, {
    style: { height: "640px" },
  }),
};

export default example;
