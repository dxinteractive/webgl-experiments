import type { ExperimentDefinition } from "../types";
import { shadertoy } from "./utils/shadertoy";

const shader = `
void main() {
  fragColor = vec4(v_uv, sin(u_time), 1.0);
}
`;

const example: ExperimentDefinition = {
  id: "shadertoy-clone",
  filename: "33-shadertoy-clone.tsx",
  name: "Webgl shadertoy clone",
  description:
    "A shadertoy clone for easily writing frag shaders on full screen quads",
  Component: shadertoy({
    width: 128,
    height: 96,
    cssWidth: "640px",
    shader,
  }),
};

export default example;
