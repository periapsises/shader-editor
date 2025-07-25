/**
 * GLSL Language Definitions for Autocomplete and Documentation
 * Comprehensive definitions for GLSL ES 3.0 built-ins
 */

export const GLSL_DEFINITIONS = {
    // Built-in types
    types: {
        // Scalar types
        'bool': { type: 'type', doc: 'Boolean type (true/false)' },
        'int': { type: 'type', doc: 'Signed integer type' },
        'uint': { type: 'type', doc: 'Unsigned integer type' },
        'float': { type: 'type', doc: 'Single-precision floating-point type' },
        
        // Vector types
        'vec2': { type: 'type', doc: 'Two-component floating-point vector' },
        'vec3': { type: 'type', doc: 'Three-component floating-point vector' },
        'vec4': { type: 'type', doc: 'Four-component floating-point vector' },
        'bvec2': { type: 'type', doc: 'Two-component boolean vector' },
        'bvec3': { type: 'type', doc: 'Three-component boolean vector' },
        'bvec4': { type: 'type', doc: 'Four-component boolean vector' },
        'ivec2': { type: 'type', doc: 'Two-component integer vector' },
        'ivec3': { type: 'type', doc: 'Three-component integer vector' },
        'ivec4': { type: 'type', doc: 'Four-component integer vector' },
        'uvec2': { type: 'type', doc: 'Two-component unsigned integer vector' },
        'uvec3': { type: 'type', doc: 'Three-component unsigned integer vector' },
        'uvec4': { type: 'type', doc: 'Four-component unsigned integer vector' },
        
        // Matrix types
        'mat2': { type: 'type', doc: '2x2 floating-point matrix' },
        'mat3': { type: 'type', doc: '3x3 floating-point matrix' },
        'mat4': { type: 'type', doc: '4x4 floating-point matrix' },
        'mat2x2': { type: 'type', doc: '2x2 floating-point matrix' },
        'mat2x3': { type: 'type', doc: '2x3 floating-point matrix' },
        'mat2x4': { type: 'type', doc: '2x4 floating-point matrix' },
        'mat3x2': { type: 'type', doc: '3x2 floating-point matrix' },
        'mat3x3': { type: 'type', doc: '3x3 floating-point matrix' },
        'mat3x4': { type: 'type', doc: '3x4 floating-point matrix' },
        'mat4x2': { type: 'type', doc: '4x2 floating-point matrix' },
        'mat4x3': { type: 'type', doc: '4x3 floating-point matrix' },
        'mat4x4': { type: 'type', doc: '4x4 floating-point matrix' },
        
        // Sampler types
        'sampler2D': { type: 'type', doc: '2D texture sampler' },
        'sampler3D': { type: 'type', doc: '3D texture sampler' },
        'samplerCube': { type: 'type', doc: 'Cube map texture sampler' },
        'sampler2DArray': { type: 'type', doc: '2D array texture sampler' },
        'isampler2D': { type: 'type', doc: '2D integer texture sampler' },
        'usampler2D': { type: 'type', doc: '2D unsigned integer texture sampler' },
    },

    // Built-in variables
    variables: {
        // Vertex shader built-ins
        'gl_Position': { type: 'variable', doc: 'Vertex position in clip coordinates (vec4)', scope: 'vertex' },
        'gl_PointSize': { type: 'variable', doc: 'Point size for point primitives (float)', scope: 'vertex' },
        'gl_VertexID': { type: 'variable', doc: 'Current vertex index (int)', scope: 'vertex' },
        'gl_InstanceID': { type: 'variable', doc: 'Current instance index (int)', scope: 'vertex' },
        
        // Fragment shader built-ins
        'gl_FragCoord': { type: 'variable', doc: 'Fragment screen-space coordinates (vec4)', scope: 'fragment' },
        'gl_FrontFacing': { type: 'variable', doc: 'True if fragment is front-facing (bool)', scope: 'fragment' },
        'gl_PointCoord': { type: 'variable', doc: 'Point sprite coordinate (vec2)', scope: 'fragment' },
        'gl_FragDepth': { type: 'variable', doc: 'Fragment depth value (float)', scope: 'fragment' },
    },

    // Qualifiers
    qualifiers: {
        // Storage qualifiers
        'const': { type: 'qualifier', doc: 'Compile-time constant' },
        'in': { type: 'qualifier', doc: 'Input variable from previous stage' },
        'out': { type: 'qualifier', doc: 'Output variable to next stage' },
        'uniform': { type: 'qualifier', doc: 'Read-only variable shared across primitives' },
        'varying': { type: 'qualifier', doc: 'Interpolated variable between vertex and fragment (deprecated in ES 3.0)' },
        'attribute': { type: 'qualifier', doc: 'Per-vertex input variable (deprecated in ES 3.0)' },
        
        // Precision qualifiers
        'highp': { type: 'qualifier', doc: 'High precision qualifier' },
        'mediump': { type: 'qualifier', doc: 'Medium precision qualifier' },
        'lowp': { type: 'qualifier', doc: 'Low precision qualifier' },
        'precision': { type: 'qualifier', doc: 'Precision declaration' },
        
        // Interpolation qualifiers
        'smooth': { type: 'qualifier', doc: 'Smooth interpolation (default)' },
        'flat': { type: 'qualifier', doc: 'No interpolation' },
        'centroid': { type: 'qualifier', doc: 'Centroid interpolation' },
    },

    // Built-in functions
    functions: {
        // Math functions
        'radians': {
            type: 'function',
            signature: 'radians(degrees)',
            doc: 'Convert degrees to radians',
            params: [{ name: 'degrees', type: 'float|vec2|vec3|vec4', doc: 'Angle in degrees' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'degrees': {
            type: 'function',
            signature: 'degrees(radians)',
            doc: 'Convert radians to degrees',
            params: [{ name: 'radians', type: 'float|vec2|vec3|vec4', doc: 'Angle in radians' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'sin': {
            type: 'function',
            signature: 'sin(angle)',
            doc: 'Sine function',
            params: [{ name: 'angle', type: 'float|vec2|vec3|vec4', doc: 'Angle in radians' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'cos': {
            type: 'function',
            signature: 'cos(angle)',
            doc: 'Cosine function',
            params: [{ name: 'angle', type: 'float|vec2|vec3|vec4', doc: 'Angle in radians' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'tan': {
            type: 'function',
            signature: 'tan(angle)',
            doc: 'Tangent function',
            params: [{ name: 'angle', type: 'float|vec2|vec3|vec4', doc: 'Angle in radians' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'asin': {
            type: 'function',
            signature: 'asin(x)',
            doc: 'Arc sine function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value [-1, 1]' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'acos': {
            type: 'function',
            signature: 'acos(x)',
            doc: 'Arc cosine function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value [-1, 1]' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'atan': {
            type: 'function',
            signature: 'atan(y_over_x) / atan(y, x)',
            doc: 'Arc tangent function',
            params: [
                { name: 'y_over_x', type: 'float|vec2|vec3|vec4', doc: 'Ratio y/x' },
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'X component (optional)' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'sinh': {
            type: 'function',
            signature: 'sinh(x)',
            doc: 'Hyperbolic sine function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'cosh': {
            type: 'function',
            signature: 'cosh(x)',
            doc: 'Hyperbolic cosine function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'tanh': {
            type: 'function',
            signature: 'tanh(x)',
            doc: 'Hyperbolic tangent function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'asinh': {
            type: 'function',
            signature: 'asinh(x)',
            doc: 'Inverse hyperbolic sine function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'acosh': {
            type: 'function',
            signature: 'acosh(x)',
            doc: 'Inverse hyperbolic cosine function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value >= 1' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'atanh': {
            type: 'function',
            signature: 'atanh(x)',
            doc: 'Inverse hyperbolic tangent function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value [-1, 1]' }],
            returns: 'float|vec2|vec3|vec4'
        },

        // Exponential functions
        'pow': {
            type: 'function',
            signature: 'pow(x, y)',
            doc: 'Power function (x^y)',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Base value' },
                { name: 'y', type: 'float|vec2|vec3|vec4', doc: 'Exponent' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'exp': {
            type: 'function',
            signature: 'exp(x)',
            doc: 'Natural exponential function (e^x)',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Exponent' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'log': {
            type: 'function',
            signature: 'log(x)',
            doc: 'Natural logarithm function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value > 0' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'exp2': {
            type: 'function',
            signature: 'exp2(x)',
            doc: 'Base 2 exponential function (2^x)',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Exponent' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'log2': {
            type: 'function',
            signature: 'log2(x)',
            doc: 'Base 2 logarithm function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value > 0' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'sqrt': {
            type: 'function',
            signature: 'sqrt(x)',
            doc: 'Square root function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value >= 0' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'inversesqrt': {
            type: 'function',
            signature: 'inversesqrt(x)',
            doc: 'Inverse square root function (1/sqrt(x))',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value > 0' }],
            returns: 'float|vec2|vec3|vec4'
        },

        // Common functions
        'abs': {
            type: 'function',
            signature: 'abs(x)',
            doc: 'Absolute value function',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4'
        },
        'sign': {
            type: 'function',
            signature: 'sign(x)',
            doc: 'Sign function (-1, 0, or 1)',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4'
        },
        'floor': {
            type: 'function',
            signature: 'floor(x)',
            doc: 'Largest integer less than or equal to x',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'trunc': {
            type: 'function',
            signature: 'trunc(x)',
            doc: 'Truncate to integer (towards zero)',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'round': {
            type: 'function',
            signature: 'round(x)',
            doc: 'Round to nearest integer',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'roundEven': {
            type: 'function',
            signature: 'roundEven(x)',
            doc: 'Round to nearest even integer',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'ceil': {
            type: 'function',
            signature: 'ceil(x)',
            doc: 'Smallest integer greater than or equal to x',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'fract': {
            type: 'function',
            signature: 'fract(x)',
            doc: 'Fractional part of x (x - floor(x))',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'mod': {
            type: 'function',
            signature: 'mod(x, y)',
            doc: 'Modulo function (x - y * floor(x/y))',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Dividend' },
                { name: 'y', type: 'float|vec2|vec3|vec4', doc: 'Divisor' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'min': {
            type: 'function',
            signature: 'min(x, y)',
            doc: 'Minimum of two values',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'First value' },
                { name: 'y', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'Second value' }
            ],
            returns: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4'
        },
        'max': {
            type: 'function',
            signature: 'max(x, y)',
            doc: 'Maximum of two values',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'First value' },
                { name: 'y', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'Second value' }
            ],
            returns: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4'
        },
        'clamp': {
            type: 'function',
            signature: 'clamp(x, minVal, maxVal)',
            doc: 'Constrain value to range [minVal, maxVal]',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'Value to clamp' },
                { name: 'minVal', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'Minimum value' },
                { name: 'maxVal', type: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4', doc: 'Maximum value' }
            ],
            returns: 'float|vec2|vec3|vec4|int|ivec2|ivec3|ivec4|uint|uvec2|uvec3|uvec4'
        },
        'mix': {
            type: 'function',
            signature: 'mix(x, y, a)',
            doc: 'Linear interpolation (x * (1-a) + y * a)',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Start value' },
                { name: 'y', type: 'float|vec2|vec3|vec4', doc: 'End value' },
                { name: 'a', type: 'float|vec2|vec3|vec4|bool|bvec2|bvec3|bvec4', doc: 'Interpolation factor' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'step': {
            type: 'function',
            signature: 'step(edge, x)',
            doc: 'Step function (0.0 if x < edge, 1.0 otherwise)',
            params: [
                { name: 'edge', type: 'float|vec2|vec3|vec4', doc: 'Edge value' },
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'smoothstep': {
            type: 'function',
            signature: 'smoothstep(edge0, edge1, x)',
            doc: 'Smooth Hermite interpolation between 0 and 1',
            params: [
                { name: 'edge0', type: 'float|vec2|vec3|vec4', doc: 'Lower edge' },
                { name: 'edge1', type: 'float|vec2|vec3|vec4', doc: 'Upper edge' },
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input value' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },

        // Geometric functions
        'length': {
            type: 'function',
            signature: 'length(x)',
            doc: 'Length of vector',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input vector' }],
            returns: 'float'
        },
        'distance': {
            type: 'function',
            signature: 'distance(p0, p1)',
            doc: 'Distance between two points',
            params: [
                { name: 'p0', type: 'float|vec2|vec3|vec4', doc: 'First point' },
                { name: 'p1', type: 'float|vec2|vec3|vec4', doc: 'Second point' }
            ],
            returns: 'float'
        },
        'dot': {
            type: 'function',
            signature: 'dot(x, y)',
            doc: 'Dot product of two vectors',
            params: [
                { name: 'x', type: 'float|vec2|vec3|vec4', doc: 'First vector' },
                { name: 'y', type: 'float|vec2|vec3|vec4', doc: 'Second vector' }
            ],
            returns: 'float'
        },
        'cross': {
            type: 'function',
            signature: 'cross(x, y)',
            doc: 'Cross product of two 3D vectors',
            params: [
                { name: 'x', type: 'vec3', doc: 'First vector' },
                { name: 'y', type: 'vec3', doc: 'Second vector' }
            ],
            returns: 'vec3'
        },
        'normalize': {
            type: 'function',
            signature: 'normalize(x)',
            doc: 'Normalize vector to unit length',
            params: [{ name: 'x', type: 'float|vec2|vec3|vec4', doc: 'Input vector' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'faceforward': {
            type: 'function',
            signature: 'faceforward(N, I, Nref)',
            doc: 'Return N if dot(Nref, I) < 0, otherwise -N',
            params: [
                { name: 'N', type: 'float|vec2|vec3|vec4', doc: 'Normal to orient' },
                { name: 'I', type: 'float|vec2|vec3|vec4', doc: 'Incident vector' },
                { name: 'Nref', type: 'float|vec2|vec3|vec4', doc: 'Reference normal' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'reflect': {
            type: 'function',
            signature: 'reflect(I, N)',
            doc: 'Reflection vector',
            params: [
                { name: 'I', type: 'float|vec2|vec3|vec4', doc: 'Incident vector' },
                { name: 'N', type: 'float|vec2|vec3|vec4', doc: 'Normal vector' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },
        'refract': {
            type: 'function',
            signature: 'refract(I, N, eta)',
            doc: 'Refraction vector',
            params: [
                { name: 'I', type: 'float|vec2|vec3|vec4', doc: 'Incident vector' },
                { name: 'N', type: 'float|vec2|vec3|vec4', doc: 'Normal vector' },
                { name: 'eta', type: 'float', doc: 'Ratio of indices of refraction' }
            ],
            returns: 'float|vec2|vec3|vec4'
        },

        // Matrix functions
        'matrixCompMult': {
            type: 'function',
            signature: 'matrixCompMult(x, y)',
            doc: 'Component-wise matrix multiplication',
            params: [
                { name: 'x', type: 'mat2|mat3|mat4', doc: 'First matrix' },
                { name: 'y', type: 'mat2|mat3|mat4', doc: 'Second matrix' }
            ],
            returns: 'mat2|mat3|mat4'
        },
        'outerProduct': {
            type: 'function',
            signature: 'outerProduct(c, r)',
            doc: 'Outer product of two vectors',
            params: [
                { name: 'c', type: 'vec2|vec3|vec4', doc: 'Column vector' },
                { name: 'r', type: 'vec2|vec3|vec4', doc: 'Row vector' }
            ],
            returns: 'mat2|mat3|mat4'
        },
        'transpose': {
            type: 'function',
            signature: 'transpose(m)',
            doc: 'Matrix transpose',
            params: [{ name: 'm', type: 'mat2|mat3|mat4', doc: 'Input matrix' }],
            returns: 'mat2|mat3|mat4'
        },
        'determinant': {
            type: 'function',
            signature: 'determinant(m)',
            doc: 'Matrix determinant',
            params: [{ name: 'm', type: 'mat2|mat3|mat4', doc: 'Input matrix' }],
            returns: 'float'
        },
        'inverse': {
            type: 'function',
            signature: 'inverse(m)',
            doc: 'Matrix inverse',
            params: [{ name: 'm', type: 'mat2|mat3|mat4', doc: 'Input matrix' }],
            returns: 'mat2|mat3|mat4'
        },

        // Vector relational functions
        'lessThan': {
            type: 'function',
            signature: 'lessThan(x, y)',
            doc: 'Component-wise less than comparison',
            params: [
                { name: 'x', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'First vector' },
                { name: 'y', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'Second vector' }
            ],
            returns: 'bvec2|bvec3|bvec4'
        },
        'lessThanEqual': {
            type: 'function',
            signature: 'lessThanEqual(x, y)',
            doc: 'Component-wise less than or equal comparison',
            params: [
                { name: 'x', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'First vector' },
                { name: 'y', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'Second vector' }
            ],
            returns: 'bvec2|bvec3|bvec4'
        },
        'greaterThan': {
            type: 'function',
            signature: 'greaterThan(x, y)',
            doc: 'Component-wise greater than comparison',
            params: [
                { name: 'x', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'First vector' },
                { name: 'y', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'Second vector' }
            ],
            returns: 'bvec2|bvec3|bvec4'
        },
        'greaterThanEqual': {
            type: 'function',
            signature: 'greaterThanEqual(x, y)',
            doc: 'Component-wise greater than or equal comparison',
            params: [
                { name: 'x', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'First vector' },
                { name: 'y', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4', doc: 'Second vector' }
            ],
            returns: 'bvec2|bvec3|bvec4'
        },
        'equal': {
            type: 'function',
            signature: 'equal(x, y)',
            doc: 'Component-wise equality comparison',
            params: [
                { name: 'x', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|bvec2|bvec3|bvec4', doc: 'First vector' },
                { name: 'y', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|bvec2|bvec3|bvec4', doc: 'Second vector' }
            ],
            returns: 'bvec2|bvec3|bvec4'
        },
        'notEqual': {
            type: 'function',
            signature: 'notEqual(x, y)',
            doc: 'Component-wise inequality comparison',
            params: [
                { name: 'x', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|bvec2|bvec3|bvec4', doc: 'First vector' },
                { name: 'y', type: 'vec2|vec3|vec4|ivec2|ivec3|ivec4|uvec2|uvec3|uvec4|bvec2|bvec3|bvec4', doc: 'Second vector' }
            ],
            returns: 'bvec2|bvec3|bvec4'
        },
        'any': {
            type: 'function',
            signature: 'any(x)',
            doc: 'True if any component is true',
            params: [{ name: 'x', type: 'bvec2|bvec3|bvec4', doc: 'Boolean vector' }],
            returns: 'bool'
        },
        'all': {
            type: 'function',
            signature: 'all(x)',
            doc: 'True if all components are true',
            params: [{ name: 'x', type: 'bvec2|bvec3|bvec4', doc: 'Boolean vector' }],
            returns: 'bool'
        },
        'not': {
            type: 'function',
            signature: 'not(x)',
            doc: 'Component-wise logical NOT',
            params: [{ name: 'x', type: 'bvec2|bvec3|bvec4', doc: 'Boolean vector' }],
            returns: 'bvec2|bvec3|bvec4'
        },

        // Texture functions
        'texture': {
            type: 'function',
            signature: 'texture(sampler, P [, bias])',
            doc: 'Sample texture at coordinates',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|samplerCube|sampler2DArray', doc: 'Texture sampler' },
                { name: 'P', type: 'vec2|vec3', doc: 'Texture coordinates' },
                { name: 'bias', type: 'float', doc: 'LOD bias (optional)' }
            ],
            returns: 'vec4'
        },
        'textureProj': {
            type: 'function',
            signature: 'textureProj(sampler, P [, bias])',
            doc: 'Sample texture with projective coordinates',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D', doc: 'Texture sampler' },
                { name: 'P', type: 'vec3|vec4', doc: 'Projective texture coordinates' },
                { name: 'bias', type: 'float', doc: 'LOD bias (optional)' }
            ],
            returns: 'vec4'
        },
        'textureLod': {
            type: 'function',
            signature: 'textureLod(sampler, P, lod)',
            doc: 'Sample texture at specific LOD level',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|samplerCube|sampler2DArray', doc: 'Texture sampler' },
                { name: 'P', type: 'vec2|vec3', doc: 'Texture coordinates' },
                { name: 'lod', type: 'float', doc: 'Level of detail' }
            ],
            returns: 'vec4'
        },
        'textureOffset': {
            type: 'function',
            signature: 'textureOffset(sampler, P, offset [, bias])',
            doc: 'Sample texture with texel offset',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|sampler2DArray', doc: 'Texture sampler' },
                { name: 'P', type: 'vec2|vec3', doc: 'Texture coordinates' },
                { name: 'offset', type: 'ivec2|ivec3', doc: 'Texel offset' },
                { name: 'bias', type: 'float', doc: 'LOD bias (optional)' }
            ],
            returns: 'vec4'
        },
        'texelFetch': {
            type: 'function',
            signature: 'texelFetch(sampler, P, lod)',
            doc: 'Fetch single texel',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|sampler2DArray', doc: 'Texture sampler' },
                { name: 'P', type: 'ivec2|ivec3', doc: 'Texel coordinates' },
                { name: 'lod', type: 'int', doc: 'LOD level' }
            ],
            returns: 'vec4'
        },
        'texelFetchOffset': {
            type: 'function',
            signature: 'texelFetchOffset(sampler, P, lod, offset)',
            doc: 'Fetch single texel with offset',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|sampler2DArray', doc: 'Texture sampler' },
                { name: 'P', type: 'ivec2|ivec3', doc: 'Texel coordinates' },
                { name: 'lod', type: 'int', doc: 'LOD level' },
                { name: 'offset', type: 'ivec2|ivec3', doc: 'Texel offset' }
            ],
            returns: 'vec4'
        },
        'textureSize': {
            type: 'function',
            signature: 'textureSize(sampler, lod)',
            doc: 'Get texture size at LOD level',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|samplerCube|sampler2DArray', doc: 'Texture sampler' },
                { name: 'lod', type: 'int', doc: 'LOD level' }
            ],
            returns: 'ivec2|ivec3'
        },
        'textureGrad': {
            type: 'function',
            signature: 'textureGrad(sampler, P, dPdx, dPdy)',
            doc: 'Sample texture with explicit gradients',
            params: [
                { name: 'sampler', type: 'sampler2D|sampler3D|samplerCube|sampler2DArray', doc: 'Texture sampler' },
                { name: 'P', type: 'vec2|vec3', doc: 'Texture coordinates' },
                { name: 'dPdx', type: 'vec2|vec3', doc: 'X gradient' },
                { name: 'dPdy', type: 'vec2|vec3', doc: 'Y gradient' }
            ],
            returns: 'vec4'
        },

        // Fragment processing functions
        'dFdx': {
            type: 'function',
            signature: 'dFdx(p)',
            doc: 'Derivative in x direction',
            params: [{ name: 'p', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'dFdy': {
            type: 'function',
            signature: 'dFdy(p)',
            doc: 'Derivative in y direction',
            params: [{ name: 'p', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'fwidth': {
            type: 'function',
            signature: 'fwidth(p)',
            doc: 'Sum of absolute derivatives (abs(dFdx) + abs(dFdy))',
            params: [{ name: 'p', type: 'float|vec2|vec3|vec4', doc: 'Input value' }],
            returns: 'float|vec2|vec3|vec4'
        },

        // Bit manipulation functions (ES 3.0)
        'floatBitsToInt': {
            type: 'function',
            signature: 'floatBitsToInt(value)',
            doc: 'Convert float bits to int representation',
            params: [{ name: 'value', type: 'float|vec2|vec3|vec4', doc: 'Float value' }],
            returns: 'int|ivec2|ivec3|ivec4'
        },
        'floatBitsToUint': {
            type: 'function',
            signature: 'floatBitsToUint(value)',
            doc: 'Convert float bits to uint representation',
            params: [{ name: 'value', type: 'float|vec2|vec3|vec4', doc: 'Float value' }],
            returns: 'uint|uvec2|uvec3|uvec4'
        },
        'intBitsToFloat': {
            type: 'function',
            signature: 'intBitsToFloat(value)',
            doc: 'Convert int bits to float representation',
            params: [{ name: 'value', type: 'int|ivec2|ivec3|ivec4', doc: 'Int value' }],
            returns: 'float|vec2|vec3|vec4'
        },
        'uintBitsToFloat': {
            type: 'function',
            signature: 'uintBitsToFloat(value)',
            doc: 'Convert uint bits to float representation',
            params: [{ name: 'value', type: 'uint|uvec2|uvec3|uvec4', doc: 'Uint value' }],
            returns: 'float|vec2|vec3|vec4'
        },
    },

    // Control flow keywords
    keywords: {
        'void': { type: 'keyword', doc: 'No return value type' },
        'main': { type: 'keyword', doc: 'Main function entry point' },
        'return': { type: 'keyword', doc: 'Return from function' },
        'if': { type: 'keyword', doc: 'Conditional statement' },
        'else': { type: 'keyword', doc: 'Else clause' },
        'for': { type: 'keyword', doc: 'For loop' },
        'while': { type: 'keyword', doc: 'While loop' },
        'do': { type: 'keyword', doc: 'Do-while loop' },
        'break': { type: 'keyword', doc: 'Break from loop' },
        'continue': { type: 'keyword', doc: 'Continue to next iteration' },
        'discard': { type: 'keyword', doc: 'Discard fragment (fragment shader only)' },
        'struct': { type: 'keyword', doc: 'Define structure' },
        'true': { type: 'keyword', doc: 'Boolean true literal' },
        'false': { type: 'keyword', doc: 'Boolean false literal' },
    },

    // Preprocessor directives
    preprocessor: {
        '#version': { type: 'preprocessor', doc: 'Specify GLSL version' },
        '#define': { type: 'preprocessor', doc: 'Define macro' },
        '#undef': { type: 'preprocessor', doc: 'Undefine macro' },
        '#if': { type: 'preprocessor', doc: 'Conditional compilation' },
        '#ifdef': { type: 'preprocessor', doc: 'If macro defined' },
        '#ifndef': { type: 'preprocessor', doc: 'If macro not defined' },
        '#else': { type: 'preprocessor', doc: 'Else clause' },
        '#elif': { type: 'preprocessor', doc: 'Else if clause' },
        '#endif': { type: 'preprocessor', doc: 'End conditional' },
        '#error': { type: 'preprocessor', doc: 'Generate error' },
        '#pragma': { type: 'preprocessor', doc: 'Implementation-specific directive' },
        '#extension': { type: 'preprocessor', doc: 'Enable/disable extensions' },
        '#line': { type: 'preprocessor', doc: 'Set line number' },
    }
};

/**
 * Get all completion items for autocomplete
 */
export function getAllCompletions() {
    const completions = [];
    
    // Add all categories
    Object.entries(GLSL_DEFINITIONS).forEach(([category, items]) => {
        Object.entries(items).forEach(([name, definition]) => {
            const completion = {
                caption: name,
                value: name,
                score: getScoreForType(definition.type),
                meta: definition.type,
                docHTML: formatDocumentation(name, definition)
            };
            
            // Add snippet for functions
            if (definition.type === 'function') {
                completion.snippet = createFunctionSnippet(name, definition);
            }
            
            completions.push(completion);
        });
    });
    
    return completions;
}

/**
 * Get score for autocomplete ordering
 */
function getScoreForType(type) {
    const scores = {
        'function': 1000,
        'type': 900,
        'variable': 800,
        'qualifier': 700,
        'keyword': 600,
        'preprocessor': 500
    };
    return scores[type] || 100;
}

/**
 * Create function snippet with parameter placeholders
 */
function createFunctionSnippet(name, definition) {
    if (!definition.params || definition.params.length === 0) {
        return `${name}()`;
    }
    
    const params = definition.params.map((param, index) => {
        return `\${${index + 1}:${param.name}}`;
    }).join(', ');
    
    return `${name}(${params})`;
}

/**
 * Format documentation for display
 */
function formatDocumentation(name, definition) {
    let html = `<div class="ace-tooltip">`;
    
    if (definition.type === 'function') {
        html += `<div class="signature"><strong>${definition.signature}</strong></div>`;
        html += `<div class="description">${definition.doc}</div>`;
        
        if (definition.params && definition.params.length > 0) {
            html += `<div class="params"><strong>Parameters:</strong><ul>`;
            definition.params.forEach(param => {
                html += `<li><code>${param.name}</code> (${param.type}): ${param.doc}</li>`;
            });
            html += `</ul></div>`;
        }
        
        if (definition.returns) {
            html += `<div class="returns"><strong>Returns:</strong> ${definition.returns}</div>`;
        }
    } else {
        html += `<div class="name"><strong>${name}</strong></div>`;
        html += `<div class="description">${definition.doc}</div>`;
        if (definition.scope) {
            html += `<div class="scope"><em>Available in: ${definition.scope} shader</em></div>`;
        }
    }
    
    html += `</div>`;
    return html;
}

/**
 * Find definition by name
 */
export function findDefinition(name) {
    for (const [category, items] of Object.entries(GLSL_DEFINITIONS)) {
        if (items[name]) {
            return {
                category,
                definition: items[name]
            };
        }
    }
    return null;
}

/**
 * Get completions filtered by prefix
 */
export function getFilteredCompletions(prefix) {
    const allCompletions = getAllCompletions();
    if (!prefix) return allCompletions;
    
    const lowerPrefix = prefix.toLowerCase();
    return allCompletions.filter(completion => 
        completion.caption.toLowerCase().startsWith(lowerPrefix)
    );
} 