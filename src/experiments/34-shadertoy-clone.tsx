import type { ExperimentDefinition } from "../types";
import { shadertoy } from "./utils/shadertoy";

const shader = `
void main() {
  int phase = int(mod(u_time, 3.));
  vec2 color;
  if(phase == 0) {
    color = v_uv;
  } else if(phase == 1) {
    color = v_clip;
  } else {
    color = v_view;
  }
  fragColor = vec4(color.x, 0., color.y, 1.);
}
`;

const example: ExperimentDefinition = {
  id: "shadertoy-clone",
  filename: "34-shadertoy-clone.tsx",
  name: "Shadertoy clone",
  description:
    "A shadertoy clone for easily writing frag shaders on full screen quads. Renders uv coords (0 - 1), then clip coords (-1 - 1), then view coords (-1 - 1 on y axis, aspect locked x axis)",
  Component: shadertoy({
    width: 128,
    height: 64,
    cssWidth: "640px",
    shader,
  }),
};

export default example;
