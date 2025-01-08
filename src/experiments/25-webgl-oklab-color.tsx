import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { useEffect, useRef } from "react";

const vertexShader = `#version 300 es
precision highp float;

uniform float u_colorLightness;

in vec2 a_pos;
out vec3 v_color;

void main() {
  vec2 pos = (a_pos * 2.0) - 1.0;
  gl_Position = vec4(pos, 0, 1);
  v_color = vec3(u_colorLightness, pos.x * 0.2, pos.y * -0.2);
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

function setupWebgl(
  canvasgl: HTMLCanvasElement,
  canvas2d: HTMLCanvasElement
): () => void {
  const gl = getWebgl2Context(canvasgl);
  const ctx = canvas2d.getContext("2d");
  if (!ctx) {
    throw new Error("no 2d ctx");
  }

  canvasgl.width = 640;
  canvasgl.height = 320;
  canvas2d.width = 640;
  canvas2d.height = 320;
  gl.viewport(0, 0, canvasgl.width, canvasgl.height);

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

  // render
  let rafId = 0;
  let time = 0;
  const render = () => {
    // gl
    gl.clear(gl.COLOR_BUFFER_BIT);

    const lightness = (time * 0.001) % 1;
    gl.uniform1f(uniforms.u_colorLightness, lightness);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);

    // 2d
    const steps = 20;
    ctx.clearRect(0, 0, canvas2d.width, canvas2d.height);
    for (let x = 0; x < steps; x++) {
      const xp = x / (steps - 1);

      for (let y = 0; y < steps; y++) {
        const yp = y / (steps - 1);

        const l = lightness;
        const a = xp * 0.8 - 0.4;
        const b = yp * 0.8 - 0.4;

        ctx.fillStyle = `oklab(${l} ${a} ${b})`;
        ctx.fillRect(
          canvas2d.width * (x / steps),
          canvas2d.height * (y / steps),
          canvas2d.width / steps,
          canvas2d.height / steps
        );
      }
    }

    rafId = requestAnimationFrame(render);
    time++;
  };

  render();

  return () => {
    cancelAnimationFrame(rafId);
    unbindAll(gl);
    resources.deleteAll();
  };
}

function Component() {
  const refgl = useRef<HTMLCanvasElement | null>(null);
  const ref2d = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvasgl = refgl.current;
    const canvas2d = ref2d.current;
    if (!canvasgl || !canvas2d) {
      return;
    }
    return setupWebgl(canvasgl, canvas2d);
  }, []);

  return (
    <div>
      <canvas ref={refgl} style={{ width: "640px", height: "320px" }} />
      <canvas ref={ref2d} style={{ width: "640px", height: "320px" }} />
    </div>
  );
}

const example: ExperimentDefinition = {
  id: "webgl-oklab-color",
  filename: "25-webgl-oklab-color.tsx",
  name: "OKLAB color experiment in WebGL (unfinished)",
  description: "OKLAB color experiment in WebGL",
  Component,
};

export default example;
