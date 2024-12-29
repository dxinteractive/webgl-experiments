#version 300 es

precision highp float;

in vec2 uv;
out vec4 outColor;

void main() {
  outColor = vec4(uv.x, 0.2, uv.y, 1.0);
}
