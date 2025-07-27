import { DEFAULT_SETTINGS, SHADER_PATHS } from '../../config/settings.js';
import { createDebouncedMethod } from '../../utils/debounce.js';
import { GLSLLanguageService } from '../../utils/glsl-language-service.js';

/**
 * CodeEditor component for managing ACE editors
 */
export class CodeEditor {
    constructor() {
        this.editors = new Map();
        this.languageServices = new Map();
        this.settings = DEFAULT_SETTINGS.editor;
        this.debouncedCompile = null;
        this.init();
    }

    /**
     * Initialize the code editor
     */
    init() {
        this.setupEditors();
        this.setupEventListeners();
    }

    /**
     * Setup ACE editors
     */
    setupEditors() {
        // Fragment shader editor
        const fragmentEditor = ace.edit('fragmentEditor');
        this.configureEditor(fragmentEditor, 'fragment');
        this.editors.set('fragment', fragmentEditor);

        // Vertex shader editor
        const vertexEditor = ace.edit('vertexEditor');
        this.configureEditor(vertexEditor, 'vertex');
        this.editors.set('vertex', vertexEditor);

        // Set default content
        this.loadDefaultShaders();
    }

    /**
     * Configure an individual ACE editor
     * @param {Object} editor - The ACE editor instance
     * @param {string} type - The editor type ('fragment' or 'vertex')
     */
    configureEditor(editor, type) {
        editor.setTheme(this.settings.theme);
        editor.session.setMode('ace/mode/glsl');
        editor.setOptions({
            fontSize: this.settings.fontSize,
            showPrintMargin: this.settings.showPrintMargin,
            wrap: this.settings.wrap
        });

        // Initialize GLSL language service for this editor
        const languageService = new GLSLLanguageService();
        languageService.initialize(editor, type);
        this.languageServices.set(type, languageService);
        
    }

    /**
     * Setup event listeners for editors
     */
    setupEventListeners() {
        // Create debounced compile method
        this.debouncedCompile = createDebouncedMethod(
            this.onEditorChange.bind(this),
            this.settings.compileDelay
        );

        // Setup change listeners for both editors
        this.editors.forEach((editor, type) => {
            editor.session.on('change', () => {
                this.debouncedCompile(type);
            });
        });
    }

    /**
     * Load default shaders into editors
     */
    async loadDefaultShaders() {
        try {
            const [vertexShader, fragmentShader] = await Promise.all([
                this.loadShaderFile(SHADER_PATHS.glsl.defaultVertex),
                this.loadShaderFile(SHADER_PATHS.glsl.defaultFragment)
            ]);

            this.setShaderContent('vertex', vertexShader);
            this.setShaderContent('fragment', fragmentShader);
        } catch (error) {
            console.error('Failed to load default shaders from files:', error);
            // Fallback to hardcoded defaults
            this.loadHardcodedDefaults();
        }
    }

    /**
     * Load a shader file from the filesystem
     * @param {string} path - The path to the shader file
     * @returns {Promise<string>} The shader content
     */
    async loadShaderFile(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load shader file: ${path}`);
        }
        return response.text();
    }

    /**
     * Load hardcoded default shaders as fallback
     */
    loadHardcodedDefaults() {
        const defaultVertexShader = `#version 300 es
precision highp float;

in vec4 a_position;
out vec2 v_uv;

void main() {
    gl_Position = a_position;
    v_uv = a_position.xy * 0.5 + 0.5;
}`;

        const defaultFragmentShader = `#version 300 es
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
}`;

        this.setShaderContent('vertex', defaultVertexShader);
        this.setShaderContent('fragment', defaultFragmentShader);
    }

    /**
     * Get shader content from an editor
     * @param {string} type - The editor type ('fragment' or 'vertex')
     * @returns {string} The shader content
     */
    getShaderContent(type) {
        const editor = this.editors.get(type);
        return editor ? editor.getValue() : '';
    }

    /**
     * Get shader code (alias for getShaderContent)
     * @param {string} type - The editor type
     * @returns {string} The shader content
     */
    getShaderCode(type) {
        return this.getShaderContent(type);
    }

    /**
     * Set shader content in an editor
     * @param {string} type - The editor type ('fragment' or 'vertex')
     * @param {string} content - The shader content
     */
    setShaderContent(type, content) {
        const editor = this.editors.get(type);
        if (editor) {
            editor.setValue(content, -1);
        }
    }

    /**
     * Set shader code (alias for setShaderContent)
     * @param {string} type - The editor type ('fragment' or 'vertex')
     * @param {string} content - The shader content
     */
    setShaderCode(type, content) {
        this.setShaderContent(type, content);
    }

    /**
     * Handle editor change events
     * @param {string} type - The editor type that changed
     */
    onEditorChange(type) {
        // Check if auto-compile is enabled
        const autoCompileCheckbox = document.getElementById('autoCompile');
        if (autoCompileCheckbox && autoCompileCheckbox.checked) {
            this.dispatchContentChange(type);
        }
    }

    /**
     * Reset editors to default content
     */
    resetToDefaults() {
        this.loadDefaultShaders();
    }

    /**
     * Get an editor instance
     * @param {string} type - The editor type
     * @returns {Object|null} The ACE editor instance or null
     */
    getEditor(type) {
        return this.editors.get(type) || null;
    }

    /**
     * Focus an editor
     * @param {string} type - The editor type to focus
     */
    focusEditor(type) {
        const editor = this.editors.get(type);
        if (editor) {
            editor.focus();
        }
    }

    /**
     * Update editor settings
     * @param {Object} newSettings - The new settings to apply
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Apply settings to all editors
        this.editors.forEach(editor => {
            editor.setOptions({
                fontSize: this.settings.fontSize,
                showPrintMargin: this.settings.showPrintMargin,
                wrap: this.settings.wrap
            });
            
            if (newSettings.theme) {
                editor.setTheme(this.settings.theme);
            }
        });
    }

    /**
     * Dispatch a shader content change event
     * @param {string} type - The editor type that changed
     */
    dispatchContentChange(type) {
        // Dispatch shaderChanged event for compilation
        const event = new CustomEvent('shaderChanged', {
            detail: { 
                type, 
                content: this.getShaderContent(type)
            }
        });
        document.dispatchEvent(event);
        
        // Dispatch codeChanged event for autosave
        const codeEvent = new CustomEvent('codeChanged', {
            detail: { type }
        });
        document.dispatchEvent(codeEvent);
    }

    /**
     * Add uniform to autocomplete for all shaders
     * @param {string} name - Uniform name
     * @param {string} type - Uniform type (float, vec2, etc.)
     * @param {Object} options - Additional options
     */
    addUniformCompletion(name, type, options = {}) {
        this.languageServices.forEach(service => {
            service.addUniform(name, type, options);
        });
    }

    /**
     * Remove uniform from autocomplete
     * @param {string} name - Uniform name to remove
     */
    removeUniformCompletion(name) {
        this.languageServices.forEach(service => {
            service.removeUniform(name);
        });
    }

    /**
     * Update all uniform completions from uniform manager data
     * @param {Array} uniforms - Array of uniform objects
     */
    updateUniformCompletions(uniforms) {
        // Clear existing user-defined uniforms
        this.languageServices.forEach(service => {
            service.userDefinedSymbols.clear();
        });

        // Add all current uniforms
        uniforms.forEach(uniform => {
            const doc = this.generateUniformDoc(uniform);
            this.addUniformCompletion(uniform.name, uniform.type, { doc });
        });
    }

    /**
     * Generate documentation for uniform
     * @param {Object} uniform - Uniform object
     * @returns {string} Documentation string
     */
    generateUniformDoc(uniform) {
        let doc = `Uniform of type ${uniform.type}`;
        
        if (uniform.builtin && uniform.builtin !== 'custom') {
            doc += ` (built-in: ${uniform.builtin})`;
        }
        
        if (uniform.description) {
            doc += ` - ${uniform.description}`;
        }
        
        return doc;
    }

    /**
     * Get language service for a specific shader type
     * @param {string} type - Shader type ('vertex' or 'fragment')
     * @returns {GLSLLanguageService|null} Language service instance
     */
    getLanguageService(type) {
        return this.languageServices.get(type) || null;
    }

    /**
     * Clean up editors and language services
     */
    destroy() {
        // Clean up language services
        this.languageServices.forEach(service => {
            service.destroy();
        });
        this.languageServices.clear();

        // Clean up editors
        this.editors.forEach(editor => {
            editor.destroy();
        });
        this.editors.clear();
    }

    /**
     * Add error annotations to an editor
     * @param {string} type - The editor type ('fragment' or 'vertex')
     * @param {Array} errors - Array of error objects with line, column, message, type
     */
    addErrorAnnotations(type, errors) {
        const editor = this.editors.get(type);
        if (!editor || !errors || errors.length === 0) return;

        // Clear existing annotations
        this.clearErrorAnnotations(type);

        const session = editor.getSession();
        const annotations = [];

        errors.forEach(error => {
            // Create annotation for ACE editor
            annotations.push({
                row: error.line,
                column: error.column || 0,
                text: error.message,
                type: error.type || 'error' // 'error', 'warning', or 'info'
            });

            // Add error marker to the line (for visual underline effect)
            const marker = session.addMarker(
                new ace.Range(error.line, 0, error.line, Number.MAX_VALUE),
                `ace_error_line ace_${error.type || 'error'}`,
                'fullLine',
                false
            );

            // Store marker ID for cleanup
            if (!session.$errorMarkers) {
                session.$errorMarkers = [];
            }
            session.$errorMarkers.push(marker);
        });

        // Set annotations
        session.setAnnotations(annotations);
    }

    /**
     * Clear error annotations from an editor
     * @param {string} type - The editor type ('fragment' or 'vertex')
     */
    clearErrorAnnotations(type) {
        const editor = this.editors.get(type);
        if (!editor) return;

        const session = editor.getSession();

        // Clear annotations
        session.clearAnnotations();

        // Clear error markers
        if (session.$errorMarkers) {
            session.$errorMarkers.forEach(markerId => {
                session.removeMarker(markerId);
            });
            session.$errorMarkers = [];
        }
    }

    /**
     * Clear all error annotations from all editors
     */
    clearAllErrorAnnotations() {
        this.editors.forEach((editor, type) => {
            this.clearErrorAnnotations(type);
        });
    }

    /**
     * Show errors in editors with annotations and underlines
     * @param {Array} errors - Array of parsed error objects
     */
    showErrors(errors) {
        // Clear all existing annotations
        this.clearAllErrorAnnotations();

        if (!errors || errors.length === 0) return;

        // Group errors by shader type
        const errorsByType = {
            vertex: [],
            fragment: []
        };

        errors.forEach(error => {
            if (error.shaderType === 'vertex') {
                errorsByType.vertex.push(error);
            } else if (error.shaderType === 'fragment') {
                errorsByType.fragment.push(error);
            }
        });

        // Add annotations to each editor
        if (errorsByType.vertex.length > 0) {
            this.addErrorAnnotations('vertex', errorsByType.vertex);
        }
        if (errorsByType.fragment.length > 0) {
            this.addErrorAnnotations('fragment', errorsByType.fragment);
        }
    }

    /**
     * Get the number of lines in an editor
     * @param {string} type - The editor type
     * @returns {number} Number of lines
     */
    getLineCount(type) {
        const editor = this.editors.get(type);
        return editor ? editor.getSession().getLength() : 0;
    }
} 
