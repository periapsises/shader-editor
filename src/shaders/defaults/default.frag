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
    
    // Create a colorful animated pattern
    float dist = distance(uv, center);
    float angle = atan(uv.y - center.y, uv.x - center.x);
    
    // Animated colors
    vec3 color1 = vec3(0.5 + 0.5 * sin(u_time), 0.5 + 0.5 * cos(u_time), 0.8);
    vec3 color2 = vec3(0.8, 0.5 + 0.5 * sin(u_time + 1.0), 0.5 + 0.5 * cos(u_time + 1.0));
    
    // Create spiral pattern
    float spiral = sin(dist * 10.0 - u_time * 2.0 + angle * 3.0);
    
    // Mix colors based on the spiral
    vec3 finalColor = mix(color1, color2, spiral * 0.5 + 0.5);
    
    // Add some fade from center
    finalColor *= 1.0 - dist * 0.8;
    
    fragColor = vec4(finalColor, 1.0);
} 