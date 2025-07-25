#version 300 es
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    vec2 uv = (v_uv - 0.5) * 4.0; // Center and scale
    
    float time = u_time * 0.5;
    vec2 z = uv;
    float iter = 0.0;
    
    // Simple mandelbrot-like iteration
    for(int i = 0; i < 32; i++) {
        if(dot(z, z) > 4.0) break;
        
        z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + uv + vec2(sin(time), cos(time)) * 0.3;
        iter += 1.0;
    }
    
    // Color based on iteration count
    float t = iter / 32.0;
    vec3 color = vec3(
        0.5 + 0.5 * sin(t * 6.28 + time),
        0.5 + 0.5 * sin(t * 6.28 + time + 2.0),
        0.5 + 0.5 * sin(t * 6.28 + time + 4.0)
    );
    
    fragColor = vec4(color, 1.0);
} 