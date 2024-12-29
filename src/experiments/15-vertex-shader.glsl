#version 300 es

precision highp float;

layout (location = 0) in vec3 aPosition;

uniform float u_time;

out vec2 uv;

void main() {
  float wave = sin(u_time * 0.005) * 0.1;
  vec3 p = aPosition + vec3(0.0, wave, 0.0);
  gl_Position = vec4(p, 1.0);
  uv = aPosition.xy * vec2(0.5, 0.5);
}