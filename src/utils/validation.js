/**
 * Validates a uniform name according to GLSL naming rules
 * @param {string} name - The uniform name to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidUniformName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }
    
    // Must start with letter or underscore, followed by letters, numbers, or underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Gets the default value for a uniform type
 * @param {string} type - The uniform type
 * @returns {*} The default value for that type
 */
export function getDefaultValueForType(type) {
    switch (type) {
        case 'float': return 0.0;
        case 'int': return 0;
        case 'bool': return false;
        case 'vec2': return [0.0, 0.0];
        case 'vec3': return [0.0, 0.0, 0.0];
        case 'vec4': return [0.0, 0.0, 0.0, 1.0];
        case 'texture': return { file: null, filter: 'linear', texture: null };
        default: return 0.0;
    }
}

/**
 * Validates a shader source code for basic syntax
 * @param {string} source - The shader source code
 * @param {string} type - The shader type ('vertex' or 'fragment')
 * @returns {Object} Object with isValid boolean and error message if invalid
 */
export function validateShaderSource(source, type) {
    if (!source || typeof source !== 'string') {
        return { isValid: false, error: 'Shader source cannot be empty' };
    }
    
    // Check for version directive
    if (!source.includes('#version')) {
        return { isValid: false, error: 'Shader must include #version directive' };
    }
    
    // Check for required main function
    if (!source.includes('void main()')) {
        return { isValid: false, error: 'Shader must include void main() function' };
    }
    
    // Type-specific validation
    if (type === 'vertex') {
        if (!source.includes('gl_Position')) {
            return { isValid: false, error: 'Vertex shader must set gl_Position' };
        }
    } else if (type === 'fragment') {
        if (!source.includes('fragColor') && !source.includes('gl_FragColor')) {
            return { isValid: false, error: 'Fragment shader must set fragColor or gl_FragColor' };
        }
    }
    
    return { isValid: true, error: null };
} 