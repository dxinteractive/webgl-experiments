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

uniform float u_colorLightness;

in vec2 a_pos;
out vec3 v_color;

void main() {
  vec2 pos = (a_pos * 2.0) - 1.0;
  gl_Position = vec4(pos, 0, 1);
  v_color = vec3(u_colorLightness, pos.x * 0.2, pos.y * 0.2);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 outColor;

void main() {
  float l_ = v_color.x + 0.3963377774f * v_color.y + 0.2158037573f * v_color.z;
  float m_ = v_color.x - 0.1055613458f * v_color.y - 0.0638541728f * v_color.z;
  float s_ = v_color.x - 0.0894841775f * v_color.y - 1.2914855480f * v_color.z;

  float l = l_*l_*l_;
  float m = m_*m_*m_;
  float s = s_*s_*s_;

  vec3 rgb = vec3(
		+4.0767416621f * l - 3.3077115913f * m + 0.2309699292f * s,
		-1.2684380046f * l + 2.6097574011f * m - 0.3413193965f * s,
		-0.0041960863f * l - 0.7034186147f * m + 1.7076147010f * s
  );

  // todo - linear rgb to srgb needed for gamma correction
  // todo - use vec3s, declare outside main, tidy up etc

  outColor = vec4(rgb, 1.0);
}
`;

function setupWebgl(canvas: HTMLCanvasElement): () => void {
  const gl = getWebgl2Context(canvas);
  updateCanvasSize(canvas, gl);

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

  gl.bindVertexArray(null);

  // uniforms
  gl.useProgram(program);
  const uniforms = getUniformLocations(gl, program, ["u_colorLightness"]);
  gl.uniform1f(uniforms.u_colorLightness, 0.8);

  // render
  let rafId = 0;
  const render = () => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);

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
  id: "webgl-oklab-color",
  filename: "25-webgl-oklab-color.tsx",
  name: "OKLAB color experiment in WebGL (unfinished)",
  description: "OKLAB color experiment in WebGL",
  Component: createCanvasComponent(setupWebgl, { style: { height: "640px" } }),
};

export default example;
