#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 uv = v_uv;
    
    // Create a simple animated color gradient
    vec3 color = vec3(
        0.5 + 0.5 * sin(u_time + uv.x * 3.0),
        0.5 + 0.5 * sin(u_time + uv.y * 2.0 + 2.0),
        0.5 + 0.5 * sin(u_time + (uv.x + uv.y) * 1.5 + 4.0)
    );
    
    fragColor = vec4(color, 1.0);
} 