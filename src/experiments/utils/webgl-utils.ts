export function getWebgl2Context(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("gl not supported");
  }
  return gl;
}

export function createBuffer(
  gl: WebGL2RenderingContext,
  initialData?: ArrayBuffer | ArrayBufferView,
  usage: GLenum = gl.STATIC_DRAW
) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    throw new Error("gl.createBuffer() failed");
  }
  if (initialData !== undefined) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, initialData, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  return buffer;
}

export function createVertexArray(gl: WebGL2RenderingContext) {
  const vao = gl.createVertexArray();
  if (!vao) {
    throw new Error("gl.createVertexArray() failed");
  }
  return vao;
}

export function createTexture(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("gl.createTexture() failed");
  }
  return texture;
}

export function createFramebuffer(gl: WebGL2RenderingContext) {
  const fbo = gl.createFramebuffer();
  if (!fbo) {
    throw new Error("gl.createFramebuffer() failed");
  }
  return fbo;
}

export function withVertexArray(
  gl: WebGL2RenderingContext,
  vao: WebGLVertexArrayObject,
  callback: () => void
) {
  gl.bindVertexArray(vao);
  callback();
  gl.bindVertexArray(null);
}

export type AttributeOptions = {
  name: string;
  buffer: WebGLBuffer;
  size?: GLint;
  matrixSize?: number;
  type?: GLenum;
  normalized?: boolean;
  stride?: number;
  offset?: number;
  instanced?: boolean | number;
};

export function createAttribute(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  options: AttributeOptions
) {
  const {
    name,
    buffer,
    size = 1,
    matrixSize = 1,
    type = gl.FLOAT,
    normalized = false,
    stride = 0,
    offset = 0,
    instanced = false,
  } = options;

  const attributeLoc = gl.getAttribLocation(program, name);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  for (let i = 0; i < matrixSize; i++) {
    const loc = attributeLoc + i;
    const off = offset + i * matrixSize * 4;

    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type, normalized, stride, off);

    if (instanced) {
      const count = typeof instanced === "boolean" ? 1 : instanced;
      gl.vertexAttribDivisor(loc, count);
    }
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

export class WebGLResourceManager {
  private buffers = new Set<WebGLBuffer>();
  private vaos = new Set<WebGLVertexArrayObject>();
  private textures = new Set<WebGLTexture>();
  private framebuffers = new Set<WebGLFramebuffer>();

  constructor(private gl: WebGL2RenderingContext) {}

  createBuffer(
    initialData?: ArrayBuffer | ArrayBufferView,
    usage: GLenum = this.gl.STATIC_DRAW
  ) {
    const buffer = createBuffer(this.gl, initialData, usage);
    this.buffers.add(buffer);
    return buffer;
  }

  createVertexArray() {
    const vao = createVertexArray(this.gl);
    this.vaos.add(vao);
    return vao;
  }

  createTexture() {
    const texture = createTexture(this.gl);
    this.textures.add(texture);
    return texture;
  }

  createFramebuffer() {
    const framebuffer = createFramebuffer(this.gl);
    this.framebuffers.add(framebuffer);
    return framebuffer;
  }

  deleteBuffer(buffer: WebGLBuffer) {
    this.gl.deleteBuffer(buffer);
    this.buffers.delete(buffer);
  }

  deleteVertexArray(vao: WebGLVertexArrayObject) {
    this.gl.deleteVertexArray(vao);
    this.vaos.delete(vao);
  }

  deleteTexture(texture: WebGLTexture) {
    this.gl.deleteBuffer(texture);
    this.textures.delete(texture);
  }

  deleteFramebuffer(framebuffer: WebGLFramebuffer) {
    this.gl.deleteFramebuffer(framebuffer);
    this.framebuffers.delete(framebuffer);
  }

  deleteAll() {
    for (const buffer of this.buffers) {
      this.gl.deleteBuffer(buffer);
    }
    for (const vao of this.vaos) {
      this.gl.deleteVertexArray(vao);
    }
    for (const texture of this.textures) {
      this.gl.deleteTexture(texture);
    }
    for (const framebuffer of this.framebuffers) {
      this.gl.deleteFramebuffer(framebuffer);
    }
    this.buffers.clear();
    this.vaos.clear();
    this.textures.clear();
    this.framebuffers.clear();
  }
}

export function getUniformLocation(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  silent = false
) {
  const location = gl.getUniformLocation(program, name);
  if (!location && !silent) {
    throw new Error(`could not create location ${name}`);
  }
  return location;
}

export function getUniformLocations<N extends string>(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  names: N[],
  silent = false
): Record<N, WebGLUniformLocation> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = {} as any;
  for (const name of names) {
    obj[name] = getUniformLocation(gl, program, name, silent);
  }
  return obj as Record<N, WebGLUniformLocation>;
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

export function unbindAll(gl: WebGL2RenderingContext) {
  const numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  for (let unit = 0; unit < numTextureUnits; ++unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export function createFullscreenQuadAttributes(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  resources: WebGLResourceManager
) {
  const z = 0;
  const w = 1;

  createAttribute(gl, program, {
    name: "aPosition",
    buffer: resources.createBuffer(
      new Float32Array([
        -1,
        1,
        z,
        w,
        1,
        1,
        z,
        w,
        -1,
        -1,
        z,
        w,
        -1,
        -1,
        z,
        w,
        1,
        1,
        z,
        w,
        1,
        -1,
        z,
        w,
      ])
    ),
    size: 4,
  });

  createAttribute(gl, program, {
    name: "aTexCoord",
    buffer: resources.createBuffer(
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    ),
    size: 2,
  });
}

export type AddTextureOptions = {
  nearest?: boolean;
};

export function uploadTexture(
  gl: WebGL2RenderingContext,
  texture: WebGLTexture,
  source: TexImageSource,
  options: AddTextureOptions = {}
) {
  // this does not do mips
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    options.nearest ? gl.NEAREST : gl.LINEAR
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    options.nearest ? gl.NEAREST : gl.LINEAR
  );
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}
