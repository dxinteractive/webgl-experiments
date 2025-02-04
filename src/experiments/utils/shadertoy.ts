import {
  createAttribute,
  createProgramForShaders,
  getUniformLocations,
  getWebgl2Context,
  unbindAll,
  uploadTexture,
  WebGLResourceManager,
} from "./webgl-utils";
import {
  createCanvasComponent,
  createCanvasComponentWithImages,
} from "./create-canvas-component";

type ShadertoyConfig = {
  shader: string;
  width: number;
  height: number;
  cssWidth?: string;
  cssHeight?: string;
  pixelated?: boolean;
  image?: string;
};

export function shadertoy(config: ShadertoyConfig) {
  const style: Record<string, unknown> = {};
  if (config.cssWidth) {
    style.width = config.cssWidth;
  }
  if (config.cssHeight) {
    style.height = config.cssHeight;
  }
  if (config.pixelated) {
    style.imageRendering = "pixelated";
  }

  const vertexShader = `#version 300 es

uniform vec2 u_resolution;

in vec2 a_pos;
out vec2 v_uv;
out vec2 v_clip;
out vec2 v_view;
out vec2 v_pixel;

void main() {
  gl_Position = vec4((a_pos * 2.0) - 1.0, 0, 1);
  v_uv = a_pos;
  v_clip = gl_Position.xy;
  v_view = (v_clip * u_resolution) / u_resolution.y;
  v_pixel = u_resolution * v_uv;
}
`;

  const fragmentShader = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_image;

in vec2 v_uv;
in vec2 v_clip;
in vec2 v_view;
in vec2 v_pixel;
out vec4 outColor;

${config.shader}
`;

  function setupWebgl(
    canvas: HTMLCanvasElement,
    images: HTMLImageElement[] = []
  ): () => void {
    const gl = getWebgl2Context(canvas);

    canvas.width = config.width;
    canvas.height = config.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // correct gl's flipped y when unpacking texture
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

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

    // texture
    if (images.length > 0) {
      gl.activeTexture(gl.TEXTURE0);
      const texture = uploadTexture(gl, resources.createTexture(), images[0], {
        nearest: true,
      });
      gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    // uniforms
    gl.useProgram(program);
    const uniforms = getUniformLocations(
      gl,
      program,
      ["u_resolution", "u_time", "u_image"],
      true
    );
    gl.uniform2f(uniforms.u_resolution, config.width, config.height);
    gl.uniform1f(uniforms.u_time, 0);
    gl.uniform1i(uniforms.u_image, 0);

    // render
    let rafId = 0;
    const startTime = Date.now();
    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(uniforms.u_time, (Date.now() - startTime) / 1000);

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

  return config.image
    ? createCanvasComponentWithImages(setupWebgl, [config.image], { style })
    : createCanvasComponent((a) => setupWebgl(a), { style });
}
