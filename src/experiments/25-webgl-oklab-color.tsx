import type { ExperimentDefinition } from "../types";
import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  WebGLResourceManager,
} from "./utils/webgl-utils";
import { useEffect, useRef, useState } from "react";

const vertexShader = `#version 300 es
precision highp float;

uniform float u_colorLightness;

in vec2 a_pos;
out vec3 v_color;

void main() {
  vec2 pos = (a_pos * 2.0) - 1.0;
  gl_Position = vec4(pos, 0, 1);
  v_color = vec3(u_colorLightness, pos.x * 0.33, pos.y * -0.33);
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 outColor;

float ungamma(float c) {
  return c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4);
}

vec3 srgb_to_rgb(vec3 c){return vec3(ungamma(c.r),ungamma(c.g),ungamma(c.b));}

float gamma(float c) {
  return c < 0.0031308 ? c * 12.92 : 1.055 * pow(c, 0.41666) - 0.055;
}

vec3 rgb_to_srgb(vec3 c) {
  return vec3(gamma(c.r),gamma(c.g),gamma(c.b));
}

vec3 rgb_to_oklab(vec3 c) {
  float l = 0.4121656120f * c.r + 0.5362752080f * c.g + 0.0514575653f * c.b;
  float m = 0.2118591070f * c.r + 0.6807189584f * c.g + 0.1074065790f * c.b;
  float s = 0.0883097947f * c.r + 0.2818474174f * c.g + 0.6302613616f * c.b;

  float l_ = pow(l, 1./3.);
  float m_ = pow(m, 1./3.);
  float s_ = pow(s, 1./3.);

  vec3 labResult;
  labResult.x = 0.2104542553f*l_ + 0.7936177850f*m_ - 0.0040720468f*s_;
  labResult.y = 1.9779984951f*l_ - 2.4285922050f*m_ + 0.4505937099f*s_;
  labResult.z = 0.0259040371f*l_ + 0.7827717662f*m_ - 0.8086757660f*s_;
  return labResult;
}

vec3 oklab_to_rgb(vec3 c) {
    float l_ = c.x + 0.3963377774f * c.y + 0.2158037573f * c.z;
    float m_ = c.x - 0.1055613458f * c.y - 0.0638541728f * c.z;
    float s_ = c.x - 0.0894841775f * c.y - 1.2914855480f * c.z;

    float l = l_*l_*l_;
    float m = m_*m_*m_;
    float s = s_*s_*s_;

    vec3 rgbResult;
    rgbResult.r = + 4.0767245293f*l - 3.3072168827f*m + 0.2307590544f*s;
    rgbResult.g = - 1.2681437731f*l + 2.6093323231f*m - 0.3411344290f*s;
    rgbResult.b = - 0.0041119885f*l - 0.7034763098f*m + 1.7068625689f*s;
    return rgbResult;
}
    
void main() {
  vec3 srgb = rgb_to_srgb(oklab_to_rgb(v_color));
  outColor = vec4(srgb, 1.0);

  float diff = length(outColor.rgb - clamp(outColor.rgb, 0., 1.));
  if(diff != 0.0) {
    // outColor = vec4(0.5,0.5,0.5,1.);
  }
}`;

/**
 * void main() {
  vec3 srgb = rgb_to_srgb(oklab_to_rgb(v_color));
  outColor = vec4(srgb, 1.0);

  vec3 neg = max(-srgb, 0.);
  outColor.xyz = srgb - vec3(neg.x + neg.y + neg.z);

  // vec3 pos = min(srgb - vec3(1.), 0.);
  // outColor.xyz = srgb + vec3(pos.x + pos.y + pos.z);

  float diff = length(outColor.rgb - clamp(outColor.rgb, 0., 1.));
  if(diff > 0.) {
    outColor.xyz = vec3(.5);
  }
}
 */

const lightness = {
  current: 0,
};

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
  const render = () => {
    // gl
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(uniforms.u_colorLightness, lightness.current);

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

        const l = lightness.current;
        const a = xp * 0.66 - 0.33;
        const b = yp * 0.66 - 0.33;

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

  const [valueL, setL] = useState(1);
  lightness.current = valueL;

  return (
    <div>
      <input
        type="range"
        style={{ width: "400px" }}
        min={0}
        max={1}
        value={valueL}
        onChange={(e) => setL(Number(e.target.value))}
        step={0.01}
      />
      {valueL}
      <canvas ref={refgl} style={{ width: "640px", height: "320px" }} />
      <canvas ref={ref2d} style={{ width: "640px", height: "320px" }} />
    </div>
  );
}

const example: ExperimentDefinition = {
  id: "webgl-oklab-color",
  filename: "25-webgl-oklab-color.tsx",
  name: "OKLAB color experiment in WebGL",
  description: "OKLAB color experiment in WebGL",
  Component,
};

export default example;
