#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_lastFrame; // This will be the last frame texture

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 uv = v_uv;
    
    // Sample the last frame with a slight offset for feedback effect
    vec2 offset = (u_mouse - 0.5) * 0.001;
    vec4 lastFrame = texture(u_lastFrame, uv + offset);
    
    // Create a new pattern that mixes with the last frame
    vec2 center = vec2(0.5);
    float dist = distance(uv, center);
    float pulse = sin(u_time * 3.0) * 0.5 + 0.5;
    
    // Create a circular brush following the mouse
    vec2 mousePos = u_mouse;
    float brushDist = distance(uv, mousePos);
    float brush = smoothstep(0.1, 0.05, brushDist) * pulse;
    
    // Mix the last frame with new content
    vec3 newColor = vec3(
        0.5 + 0.5 * sin(u_time + dist * 10.0),
        0.5 + 0.5 * cos(u_time * 1.2 + dist * 8.0),
        0.8
    ) * brush;
    
    // Fade the last frame slightly and add new content
    vec3 finalColor = lastFrame.rgb * 0.98 + newColor;
    
    fragColor = vec4(finalColor, 1.0);
} 