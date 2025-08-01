/**
 * Default configuration settings for the shader editor
 */
export const DEFAULT_SETTINGS = {
    // Editor settings
    editor: {
        theme: 'ace/theme/monokai',
        fontSize: 14,
        showPrintMargin: false,
        wrap: true,
        autoCompile: true,
        compileDelay: 500, // milliseconds
    },
    
    // Canvas settings
    canvas: {
        width: 512,
        height: 512,
        backgroundColor: [0.0, 0.0, 0.0, 0.0], // Changed from [0.0, 0.0, 0.0, 1.0] to transparent
    },
    
    // Uniform settings
    uniforms: {
        allowedTypes: ['float', 'int', 'bool', 'vec2', 'vec3', 'vec4', 'texture'],
        builtinTypes: [
            { value: 'custom', label: 'Custom' },
            { value: 'time', label: 'Time' },
            { value: 'resolution', label: 'Resolution' },
            { value: 'mouse', label: 'Mouse' },
            { value: 'lastFrame', label: 'Last Frame' },
            { value: 'keyState', label: 'Key State' }
        ],
        textureFilters: [
            { value: 'nearest', label: 'Nearest' },
            { value: 'linear', label: 'Linear' }
        ],
    },
    
    // Animation settings
    animation: {
        defaultPlayState: true,
        timeScale: 1.0,
        resetTimeOnCompile: true, // Reset time when shaders are compiled
    },
    
    // Autosave settings
    autosave: {
        enabled: true,
        intervalMinutes: 1, // Autosave every 1 minute
        maxStorageSize: 5 * 1024 * 1024, // 5MB max localStorage usage
        showNotifications: true, // Show autosave notifications
    },
    
    // UI settings
    ui: {
        uniformSidebarWidth: 350,
        uniformSidebarMinWidth: 300,
        uniformSidebarMaxWidth: 400,
        errorConsoleMaxHeight: 150,
    },
};

/**
 * Default uniform definitions
 */
export const DEFAULT_UNIFORMS = [
    {
        name: 'u_time',
        type: 'float',
        value: 0.0,
        builtin: 'time',
        default: true
    },
    {
        name: 'u_resolution',
        type: 'vec2',
        value: [512, 512],
        builtin: 'resolution',
        default: true
    },
    {
        name: 'u_mouse',
        type: 'vec2',
        value: [0.0, 0.0],
        builtin: 'mouse',
        default: true
    }
];

/**
 * Shader file paths
 */
export const SHADER_PATHS = {
    glsl: {
        defaultVertex: 'src/shaders/defaults/default.vert',
        defaultFragment: 'src/shaders/defaults/default.frag',
    },
    examplesDir: 'src/shaders/examples/'
};

/**
 * CDN URLs for external libraries
 */
export const CDN_URLS = {
    ace: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.0/ace.js',
    aceGlsl: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.0/mode-glsl.js',
    aceTheme: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.0/theme-monokai.js'
};

/**
 * Application constants
 */
export const CONSTANTS = {
    UNIFORM_NAME_MAX_LENGTH: 20,
    VECTOR_COMPONENT_LABELS: ['x', 'y', 'z', 'w'],
    TEXTURE_FORMATS: ['image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp'],
    SUPPORTED_SHADER_VERSIONS: ['300 es', '330', '400', '410', '420', '430', '440', '450', '460'],
    COMMON_KEYS: [
        { code: 'Space', label: 'Spacebar' },
        { code: 'Enter', label: 'Enter' },
        { code: 'Escape', label: 'Escape' },
        { code: 'Tab', label: 'Tab' },
        { code: 'ShiftLeft', label: 'Left Shift' },
        { code: 'ShiftRight', label: 'Right Shift' },
        { code: 'ControlLeft', label: 'Left Ctrl' },
        { code: 'ControlRight', label: 'Right Ctrl' },
        { code: 'AltLeft', label: 'Left Alt' },
        { code: 'AltRight', label: 'Right Alt' },
        { code: 'ArrowUp', label: 'Up Arrow' },
        { code: 'ArrowDown', label: 'Down Arrow' },
        { code: 'ArrowLeft', label: 'Left Arrow' },
        { code: 'ArrowRight', label: 'Right Arrow' },
        { code: 'KeyA', label: 'A' },
        { code: 'KeyB', label: 'B' },
        { code: 'KeyC', label: 'C' },
        { code: 'KeyD', label: 'D' },
        { code: 'KeyE', label: 'E' },
        { code: 'KeyF', label: 'F' },
        { code: 'KeyG', label: 'G' },
        { code: 'KeyH', label: 'H' },
        { code: 'KeyI', label: 'I' },
        { code: 'KeyJ', label: 'J' },
        { code: 'KeyK', label: 'K' },
        { code: 'KeyL', label: 'L' },
        { code: 'KeyM', label: 'M' },
        { code: 'KeyN', label: 'N' },
        { code: 'KeyO', label: 'O' },
        { code: 'KeyP', label: 'P' },
        { code: 'KeyQ', label: 'Q' },
        { code: 'KeyR', label: 'R' },
        { code: 'KeyS', label: 'S' },
        { code: 'KeyT', label: 'T' },
        { code: 'KeyU', label: 'U' },
        { code: 'KeyV', label: 'V' },
        { code: 'KeyW', label: 'W' },
        { code: 'KeyX', label: 'X' },
        { code: 'KeyY', label: 'Y' },
        { code: 'KeyZ', label: 'Z' },
        { code: 'Digit0', label: '0' },
        { code: 'Digit1', label: '1' },
        { code: 'Digit2', label: '2' },
        { code: 'Digit3', label: '3' },
        { code: 'Digit4', label: '4' },
        { code: 'Digit5', label: '5' },
        { code: 'Digit6', label: '6' },
        { code: 'Digit7', label: '7' },
        { code: 'Digit8', label: '8' },
        { code: 'Digit9', label: '9' }
    ]
}; 
