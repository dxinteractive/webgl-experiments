import type { ExperimentDefinition } from "../types";
import { shadertoy } from "./utils/shadertoy";

const shader = `
float pseudoRandom(float x) {
  return fract(sin(x) * 999999.9);
}

float getRippleAmplitude(float time, float dropTime) {
  float x = time - dropTime;
  if(x < 0.) {
    return 0.;
  }
  float x1 = x + 1.;
  float s = 1. / (x1 * x1 * x1 * x1);
  s -= .1;
  return sin(x * 20.) * clamp(s, 0., 1.);
}

float getRippleHeight(float time, vec2 pixel, float dropTime, vec2 dropPos) {
  float d = distance(pixel, dropPos);
  float a = getRippleAmplitude(time, dropTime + d * .004);
  a *= clamp(1. - (d / 800.), 0., 1.);
  return a;
}

void main() {
  float h = 0.;
  for(int i = 0; i < 30; i++) {
    float ii = float(i);
    float x = pseudoRandom(ii);
    float y = pseudoRandom(ii + .5);
    h += getRippleHeight(u_time, v_pixel, float(ii) * .3, vec2(x, y) * u_resolution);
  }
  vec3 color = vec3(h);
  outColor = vec4(color * .5 + .5, 1.);
}
`;

const example: ExperimentDefinition = {
  id: "ripple-displacement",
  filename: "42-ripple-displacement.tsx",
  name: "Ripple displacement",
  description: "Height map for ripples based on some sine related something",
  Component: shadertoy({
    width: 800,
    height: 400,
    cssWidth: `800px`,
    shader,
  }),
};

export default example;
