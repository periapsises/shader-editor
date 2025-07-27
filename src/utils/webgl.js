/**
 * Creates a WebGL shader from source code
 * @param {WebGL2RenderingContext} gl - The WebGL context
 * @param {number} type - The shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 * @param {string} source - The shader source code
 * @returns {WebGLShader} The compiled shader
 * @throws {Error} If shader compilation fails
 */
export function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(error);
    }

    return shader;
}

/**
 * Creates a WebGL program from vertex and fragment shaders
 * @param {WebGL2RenderingContext} gl - The WebGL context
 * @param {string} vertexSource - The vertex shader source
 * @param {string} fragmentSource - The fragment shader source
 * @returns {WebGLProgram} The linked program
 * @throws {Error} If program creation or linking fails
 */
export function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const error = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error('Shader program linking failed: ' + error);
    }

    // Clean up shaders
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
}

/**
 * Creates a WebGL texture from an image
 * @param {WebGL2RenderingContext} gl - The WebGL context
 * @param {HTMLImageElement} image - The image element
 * @param {string} filter - The filter type ('nearest' or 'linear')
 * @param {string} wrapS - The S (horizontal) wrapping mode ('clamp', 'repeat', or 'mirror')
 * @param {string} wrapT - The T (vertical) wrapping mode ('clamp', 'repeat', or 'mirror')
 * @param {boolean} isDataTexture - Whether this is a data texture (affects color space and precision)
 * @returns {WebGLTexture} The created texture
 */
export function createTexture(gl, image, filter = 'linear', wrapS = 'clamp', wrapT = 'clamp', isDataTexture = false) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // For data textures, use linear color space and precise formats
    if (isDataTexture) {
        // Use RGB format to avoid alpha blending issues and ensure linear color space
        // Note: In WebGL2, you could use gl.RGB8 or gl.RGBA8 for more control
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        
        // Force nearest filtering for data textures to avoid interpolation
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    } else {
        // Standard color texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Set filtering based on the filter parameter
        const glFilter = filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, glFilter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, glFilter);
    }
    
    // Helper function to get WebGL wrap constant
    const getWrapMode = (wrap) => {
        switch (wrap) {
            case 'repeat': return gl.REPEAT;
            case 'mirror': return gl.MIRRORED_REPEAT;
            case 'clamp':
            default: return gl.CLAMP_TO_EDGE;
        }
    };
    
    // Set wrapping
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, getWrapMode(wrapS));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, getWrapMode(wrapT));
    
    return texture;
}

/**
 * Sets a uniform value in a WebGL program
 * @param {WebGL2RenderingContext} gl - The WebGL context
 * @param {WebGLUniformLocation} location - The uniform location
 * @param {string} type - The uniform type
 * @param {*} value - The uniform value
 */
export function setUniformValue(gl, location, type, value) {
    switch (type) {
        case 'float':
            gl.uniform1f(location, value);
            break;
        case 'int':
            gl.uniform1i(location, value);
            break;
        case 'bool':
            gl.uniform1i(location, value ? 1 : 0);
            break;
        case 'vec2':
            gl.uniform2f(location, value[0], value[1]);
            break;
        case 'vec3':
            gl.uniform3f(location, value[0], value[1], value[2]);
            break;
        case 'vec4':
            gl.uniform4f(location, value[0], value[1], value[2], value[3]);
            break;
        case 'texture':
            if (value && value.image) {
                // Create or recreate WebGL texture if needed
                if (!value.texture || value.needsUpdate) {
                    if (value.texture) {
                        gl.deleteTexture(value.texture);
                    }
                    value.texture = createTexture(gl, value.image, value.filter, value.wrapS, value.wrapT, value.isDataTexture);
                    value.needsUpdate = false;
                }
                if (value.texture) {
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, value.texture);
                    gl.uniform1i(location, 0);
                }
            }
            break;
    }
}

/**
 * Creates a full-screen quad buffer
 * @param {WebGL2RenderingContext} gl - The WebGL context
 * @returns {WebGLBuffer} The vertex buffer
 */
export function createFullScreenQuad(gl) {
    const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
         1,  1
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    return buffer;
}

/**
 * Initialize WebGL context and setup basic state
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @returns {WebGL2RenderingContext} The WebGL context
 * @throws {Error} If WebGL 2.0 is not supported
 */
export function initWebGL(canvas) {
    const gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: false
    });
    if (!gl) {
        throw new Error('WebGL 2.0 is not supported by your browser.');
    }

    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    return gl;
} 

/**
 * Parse WebGL shader error message and extract line information
 * @param {string} errorMessage - The WebGL shader error message
 * @param {string} shaderType - The shader type ('vertex' or 'fragment')
 * @returns {Array} Array of error objects with line, column, and message
 */
export function parseShaderErrors(errorMessage, shaderType = 'unknown') {
    if (!errorMessage) return [];

    const errors = [];
    const lines = errorMessage.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Different browsers/drivers may have different error formats
        // Common patterns include:
        // ERROR: 0:lineNumber: error message
        // ERROR: lineNumber:columnNumber: error message
        // 0(lineNumber) : error: error message
        
        let match;
        
        // Firefox/Chrome pattern: ERROR: 0:lineNumber: message
        match = trimmedLine.match(/ERROR:\s*\d+:(\d+):\s*(.+)/i);
        if (match) {
            errors.push({
                line: parseInt(match[1]) - 1, // Convert to 0-based line numbering
                column: 0,
                message: match[2].trim(),
                type: 'error',
                shaderType
            });
            continue;
        }

        // Another common pattern: ERROR: lineNumber:columnNumber: message
        match = trimmedLine.match(/ERROR:\s*(\d+):(\d+):\s*(.+)/i);
        if (match) {
            errors.push({
                line: parseInt(match[1]) - 1, // Convert to 0-based line numbering
                column: Math.max(0, parseInt(match[2]) - 1), // Convert to 0-based column numbering
                message: match[3].trim(),
                type: 'error',
                shaderType
            });
            continue;
        }

        // NVIDIA pattern: 0(lineNumber) : error: message
        match = trimmedLine.match(/\d+\((\d+)\)\s*:\s*(error|warning):\s*(.+)/i);
        if (match) {
            errors.push({
                line: parseInt(match[1]) - 1, // Convert to 0-based line numbering
                column: 0,
                message: match[3].trim(),
                type: match[2].toLowerCase(),
                shaderType
            });
            continue;
        }

        // Generic pattern for other drivers: try to extract any line number
        match = trimmedLine.match(/(?:line\s*)?(\d+)[\s:]*(.+)/i);
        if (match && parseInt(match[1]) > 0) {
            errors.push({
                line: parseInt(match[1]) - 1, // Convert to 0-based line numbering
                column: 0,
                message: match[2].trim(),
                type: 'error',
                shaderType
            });
            continue;
        }

        // If no line number found, add as general error
        if (trimmedLine.toLowerCase().includes('error') || 
            trimmedLine.toLowerCase().includes('warning')) {
            errors.push({
                line: 0,
                column: 0,
                message: trimmedLine,
                type: 'error',
                shaderType
            });
        }
    }

    return errors;
} 
