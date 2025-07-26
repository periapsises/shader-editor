#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform bool u_spacePressed;    // Spacebar for flash effect
uniform bool u_leftMouse;       // Left mouse button for red effect  
uniform bool u_rightMouse;      // Right mouse button for blue effect

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 uv = v_uv;
    
    // Base color animation
    vec3 baseColor = vec3(
        0.5 + 0.5 * sin(u_time * 2.0),
        0.5 + 0.5 * sin(u_time * 1.5 + 2.0),
        0.5 + 0.5 * sin(u_time * 1.8 + 4.0)
    );
    
    // Create a pulsing circle pattern
    float dist = distance(uv, vec2(0.5));
    float circle = sin(dist * 20.0 - u_time * 5.0) * 0.5 + 0.5;
    circle = smoothstep(0.4, 0.6, circle);
    
    // Mix base color with the circle pattern
    vec3 finalColor = mix(baseColor * 0.3, baseColor, circle);
    
    // Spacebar: bright white flash from center
    if (u_spacePressed) {
        float flash = 0.8 * (1.0 - dist * 2.0); // Bright center, fading to edges
        flash = max(0.0, flash);
        finalColor += vec3(flash);
    }
    
    // Left mouse button: red ripple effect
    if (u_leftMouse) {
        float ripple = sin(dist * 15.0 - u_time * 8.0) * 0.5 + 0.5;
        ripple = smoothstep(0.3, 0.7, ripple) * 0.6;
        finalColor += vec3(ripple, 0.0, 0.0); // Red tint
    }
    
    // Right mouse button: blue spiral effect
    if (u_rightMouse) {
        float angle = atan(uv.y - 0.5, uv.x - 0.5);
        float spiral = sin(dist * 12.0 + angle * 6.0 - u_time * 4.0) * 0.5 + 0.5;
        spiral = smoothstep(0.2, 0.8, spiral) * 0.5;
        finalColor += vec3(0.0, 0.2, spiral); // Blue spiral
    }
    
    fragColor = vec4(finalColor, 1.0);
} 