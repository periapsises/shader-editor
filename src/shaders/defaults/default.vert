#version 300 es
precision highp float;

in vec4 a_position;
out vec2 v_uv;

void main() {
    gl_Position = a_position;
    v_uv = a_position.xy * 0.5 + 0.5;
} 