#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 uv = v_uv;
    vec2 center = vec2(0.5);
    
    // Create an animated circle
    float dist = distance(uv, center);
    float radius = 0.2 + 0.1 * sin(u_time * 2.0);
    
    // Smooth circle edge
    float circle = 1.0 - smoothstep(radius - 0.02, radius + 0.02, dist);
    
    // Animated colors
    vec3 color = vec3(
        0.5 + 0.5 * sin(u_time),
        0.5 + 0.5 * cos(u_time * 1.2),
        0.8
    );
    
    fragColor = vec4(color * circle, 1.0);
} 