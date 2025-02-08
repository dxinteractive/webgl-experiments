import type { ExperimentDefinition } from "../types";
import { shadertoy } from "./utils/shadertoy";

const shader = `
void main() {
  vec2 uv = v_uv + sin(v_uv * 20. + (u_time * 4.)) * .01;
  outColor = texture(u_image, uv);
}
`;

const example: ExperimentDefinition = {
  id: "texture-warp",
  filename: "41-texture-warp.tsx",
  name: "Texture warp",
  description:
    "Simple texture warp by algorithmically offsetting sampled UV coords",
  Component: shadertoy({
    width: 64 * 8,
    height: 32 * 8,
    cssHeight: `${32 * 8}px`,
    image:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAACinX6EAAABmklEQVRoge2YsW3EMAxFWd4ECeIB0qu5BbLLrZAtUqSSq2yUdYKDgTBFIEBhKH5Zlo8+2MUHjLNo8D9SlM80hAvvWeSdgLf+AWBm96TcACTze4JwdIB3At5yA0BEi7UqgOvzgyn0YCuWiHj6jIvVAwIho70lzfM7z1ZPCK4AigbPo3qtQVgPwMejLWS2EJcAIIO1nbAcADLaWRIAUhp4andkAFoH46YBEBHHGDnG+AeCBCDXdQHwxU+maozmSnEIQF7h3JgGIQGQa2YBQEZbJauSILR2gHyWrPwmAWgQNAClQagZROoGIPDJFAIQ+FSEgDpgOo9N5lsgEDK6VBqEBMA6AiUA5nJHyHubApBDqO2A0gDUftPudQHw8vZtCpnWYhAA7QSYxl/VtH5aOwsAMtpb8lUYDcAcgKyyvL47AGgrlLaBpuZToJToK9liZtOoFiPnQO1f3rWOwCFcmJDRXppTzVt+IHEBkCdc077amiVtXwVAW5x/MJXbAcWXqlVbQSu21fwQjo+iB4BmAPl2uGcdHeCdgLd2D+AHBk69MX7ZEDkAAAAASUVORK5CYII=",
    shader,
  }),
};

export default example;
