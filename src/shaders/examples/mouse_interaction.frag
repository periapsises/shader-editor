#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 uv = v_uv;
    
    // Distance from mouse position
    float mouseDist = distance(uv, u_mouse);
    
    // Create ripples emanating from mouse
    float ripple = sin(mouseDist * 20.0 - u_time * 5.0) * 0.5 + 0.5;
    ripple *= 1.0 / (mouseDist * 10.0 + 1.0); // Fade with distance
    
    // Base gradient
    vec3 baseColor = vec3(0.1, 0.2, 0.4);
    
    // Add ripple effect
    vec3 rippleColor = vec3(1.0, 0.6, 0.2) * ripple;
    
    vec3 finalColor = baseColor + rippleColor;
    
    fragColor = vec4(finalColor, 1.0);
} 