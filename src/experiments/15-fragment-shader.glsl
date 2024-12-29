#version 300 es

precision highp float;

uniform float u_time;

in vec2 uv;
out vec4 outColor;

void main() {
  float wave = sin(u_time * 0.005) * 0.5 + 0.5;
  outColor = vec4(uv.x, 0.2, uv.y + wave, 1.0);
}
