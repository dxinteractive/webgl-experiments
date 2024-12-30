export function getWebgl2Context(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("gl not supported");
  }
  return gl;
}

export function createBuffer(gl: WebGL2RenderingContext) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error("gl.createBuffer() failed");
  }
  return buffer;
}

export function createVertexArray(gl: WebGL2RenderingContext) {
  const buffer = gl.createVertexArray();
  if (!buffer) {
    throw new Error("gl.createVertexArray() failed");
  }
  return buffer;
}

export function createTexture(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("gl.createTexture() failed");
  }
  return texture;
}

export function getUniformLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string
) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error("could not create location");
  }
  return location;
}

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Failed to create shader");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compilation error: ${log}`);
  }

  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);

    throw new Error(`program linking error: ${log}`);
  }

  return program;
}

export function createProgramForShaders(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  return createProgram(gl, vertexShader, fragmentShader);
}

export function updateCanvasSize(
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
