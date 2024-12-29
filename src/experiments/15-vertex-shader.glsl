#version 300 es

layout (location = 0) in vec3 aPosition;

out vec2 uv;

void main() {
  gl_Position = vec4(aPosition, 1.0);
  uv = aPosition.xy * vec2(0.5, 0.5) + vec2(0.5, 0.5);
}
