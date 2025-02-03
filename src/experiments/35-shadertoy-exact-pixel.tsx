import type { ExperimentDefinition } from "../types";
import { shadertoy } from "./utils/shadertoy";

const shader = `
void main() {
  float r = mod((v_pixel.x) / 4., 1.);
  float b = mod((v_pixel.y) / 4., 1.);
  outColor = vec4(r, 0., b, 1.);
}
`;

const example: ExperimentDefinition = {
  id: "shadertoy-exact-pixel",
  filename: "35-shadertoy-exact-pixel.tsx",
  name: "Shadertoy exact pixel",
  description: "Accessing exact pixel coords in frag shader of shadertoy clone",
  Component: shadertoy({
    width: 16,
    height: 16,
    pixelated: true,
    cssHeight: "320px",
    shader,
  }),
};

export default example;
