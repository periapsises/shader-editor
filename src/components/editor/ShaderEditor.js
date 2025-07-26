import { CodeEditor } from './CodeEditor.js';
import { TabManager } from '../ui/TabManager.js';
import { Controls } from '../ui/Controls.js';
import { ErrorConsole } from '../ui/ErrorConsole.js';
import { ExampleBrowser } from '../ui/ExampleBrowser.js';
import { PanelManager } from '../ui/PanelManager.js';
import { WebGLRenderer } from '../preview/WebGLRenderer.js';
import { UniformManager } from '../uniforms/UniformManager.js';
import { DEFAULT_SETTINGS } from '../../config/settings.js';

/**
 * Main ShaderEditor class that coordinates all components
 */
export class ShaderEditor {
    constructor() {
        this.components = {};
        this.settings = DEFAULT_SETTINGS;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.autosaveTimer = null;
        this.autosaveKey = 'shader_editor_autosave';
        this.lastAutosaveHash = null;
        this.init();
    }

    /**
     * Initialize the shader editor
     */
    init() {
        this.initializeComponents();
        this.setupEventListeners();
        this.compileInitialShaders();
        this.initializeAutosave();
    }

    /**
     * Initialize all components
     */
    initializeComponents() {
        try {
            // Initialize UI components
            this.components.errorConsole = new ErrorConsole();
            this.components.tabManager = new TabManager();
            this.components.controls = new Controls();
            this.components.exampleBrowser = new ExampleBrowser();
            this.components.panelManager = new PanelManager();
            
            // Initialize editor components
            this.components.codeEditor = new CodeEditor();
            this.components.uniformManager = new UniformManager();
            
            // Initialize WebGL renderer
            this.components.renderer = new WebGLRenderer('glCanvas');
        } catch (error) {
            console.error('Failed to initialize components:', error);
            this.components.errorConsole?.showError('Failed to initialize shader editor: ' + error.message);
        }
    }

    /**
     * Setup event listeners for inter-component communication
     */
    setupEventListeners() {
        // Handle shader compilation requests
        document.addEventListener('compileRequested', () => {
            this.compileShaders();
        });

        // Handle shader resets
        document.addEventListener('resetRequested', () => {
            this.resetShaders();
        });

        // Handle auto-compile changes
        document.addEventListener('autoCompileChanged', (e) => {
            this.onAutoCompileChanged(e.detail.enabled);
        });

        // Handle shader changes from editors
        document.addEventListener('shaderChanged', (e) => {
            this.onShaderChanged(e.detail);
        });

        // Handle render errors
        document.addEventListener('renderError', (e) => {
            this.components.errorConsole.showError(e.detail.message);
        });

        // Handle render error clearing
        document.addEventListener('renderErrorCleared', () => {
            this.components.errorConsole.hideError();
        });

        // Handle uniform updates for renderer
        document.addEventListener('uniformsUpdate', (e) => {
            this.updateRendererUniforms(e.detail);
        });

        // Handle uniform changes (for recompilation)
        document.addEventListener('uniformsChanged', (e) => {
            this.onUniformsChanged(e.detail);
        });

        // Handle animation state changes
        document.addEventListener('animationStateChanged', (e) => {
            this.onAnimationStateChanged(e.detail);
        });

        // Handle animation reset from time buttons
        document.addEventListener('animationReset', (e) => {
            this.onAnimationReset(e.detail);
        });

        // Handle tab changes
        document.addEventListener('tabChanged', (e) => {
            this.onTabChanged(e.detail);
        });

        // Handle save/load requests
        document.addEventListener('shaderSaveRequested', (e) => {
            this.saveShaderCode(e.detail.saveType);
        });

        document.addEventListener('projectExportRequested', () => {
            this.exportProject();
        });

        document.addEventListener('loadRequested', (e) => {
            this.loadProject(e.detail.data);
        });

        // Handle examples browser requests
        document.addEventListener('examplesRequested', () => {
            this.components.exampleBrowser.show();
        });

        document.addEventListener('loadExampleShader', (e) => {
            this.loadExampleShader(e.detail);
        });

        document.addEventListener('createExampleUniform', (e) => {
            this.createExampleUniform(e.detail);
        });

        // Handle canvas resize requests from uniforms
        document.addEventListener('canvasResizeRequested', (e) => {
            this.resizeCanvas(e.detail.width, e.detail.height);
        });

        // Handle capture requests
        document.addEventListener('screenshotRequested', () => {
            this.takeScreenshot();
        });

        document.addEventListener('recordingStarted', (e) => {
            this.startRecording(e.detail.duration);
        });

        document.addEventListener('recordingStopped', () => {
            this.stopRecording();
        });

        // Handle pan/zoom control events
        document.addEventListener('panZoomToggled', (e) => {
            this.onPanZoomToggled(e.detail);
        });

        document.addEventListener('viewResetRequested', () => {
            this.onViewResetRequested();
        });

        // Handle autosave events
        document.addEventListener('autosaveToggled', (e) => {
            this.onAutosaveToggled(e.detail.enabled);
        });

        document.addEventListener('autosaveIntervalChanged', (e) => {
            this.onAutosaveIntervalChanged(e.detail.intervalMinutes);
        });


    }

    /**
     * Compile shaders
     */
    compileShaders() {
        const vertexSource = this.components.codeEditor.getShaderContent('vertex');
        const fragmentSource = this.components.codeEditor.getShaderContent('fragment');
        
        if (vertexSource && fragmentSource) {
            this.components.renderer.compileShaders(vertexSource, fragmentSource);
        }
    }

    /**
     * Compile initial shaders after component initialization
     */
    compileInitialShaders() {
        // Wait a bit for all components to be ready
        setTimeout(() => {
            this.compileShaders();
            // Ensure UI button states are synchronized with renderer state
            this.syncUIWithRendererState();
            // Setup canvas filtering controls now that renderer is ready
            this.setupCanvasFilteringControls();
        }, 100);
    }

    /**
     * Initialize autosave functionality
     */
    async initializeAutosave() {
        // Set initial autosave settings from controls
        if (this.components.controls) {
            this.settings.autosave.enabled = this.components.controls.isAutosaveEnabled();
            this.settings.autosave.intervalMinutes = this.components.controls.getAutosaveInterval();
        }

        // Check for existing autosave data and offer to restore
        if (this.hasAutosaveData()) {
            await this.offerAutosaveRestore();
        }

        // Start autosave if enabled
        if (this.settings.autosave.enabled) {
            this.startAutosave();
        }
    }

    /**
     * Offer to restore from autosave data
     */
    async offerAutosaveRestore() {
        try {
            const autosaveDataString = localStorage.getItem(this.autosaveKey);
            if (!autosaveDataString) return;

            const autosaveData = JSON.parse(autosaveDataString);
            const autosaveDate = new Date(autosaveData.timestamp);
            const timeAgo = this.getTimeAgo(autosaveDate);

            const restore = confirm(
                `Autosaved data found from ${timeAgo}.\n\nWould you like to restore your previous work?`
            );

            if (restore) {
                const success = await this.restoreFromAutosave();
                if (success) {
                    this.showAutosaveNotification('Restored from autosave');
                }
            } else {
                // If user doesn't want to restore, clear the autosave data
                this.clearAutosaveData();
            }
        } catch (error) {
            console.error('Error offering autosave restore:', error);
        }
    }

    /**
     * Get human-readable time ago string
     * @param {Date} date - The date to compare
     * @returns {string} Human-readable time ago
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'just now';
        if (diffMins === 1) return '1 minute ago';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours === 1) return '1 hour ago';
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    }

    /**
     * Synchronize UI state with renderer state
     */
    syncUIWithRendererState() {
        if (this.components.renderer && this.components.uniformManager) {
            const animationState = this.components.renderer.getAnimationState();
            this.components.uniformManager.uniformUI.updateTimeButtons(animationState.playing);
        }
        
        if (this.components.renderer && this.components.controls) {
            const viewState = this.components.renderer.getViewState();
            this.components.controls.setPanZoomEnabled(viewState.enabled);
        }
    }

    /**
     * Reset shaders to default
     */
    resetShaders() {
        this.components.codeEditor.resetToDefaults();
        this.components.uniformManager.resetUniforms();
        this.components.errorConsole.clearError();
    }

    /**
     * Handle auto-compile changes
     * @param {boolean} enabled - Whether auto-compile is enabled
     */
    onAutoCompileChanged(enabled) {
        // Update editor debounce behavior if needed
    }

    /**
     * Handle shader changes
     * @param {Object} detail - Shader change details
     */
    onShaderChanged(detail) {
        
        // Auto-compile when shader content changes
        if (this.components.controls.isAutoCompileEnabled()) {
            this.compileShaders();
        }
    }

    /**
     * Update renderer uniforms
     * @param {Object} detail - Uniform update details
     */
    updateRendererUniforms(detail) {
        this.components.renderer.setUniforms(detail.uniforms, detail.builtinAssociations);
        
        // Update autocomplete with current uniforms
        this.updateAutocompleteUniforms();
    }

    /**
     * Handle uniform changes
     * @param {Object} detail - Uniform change details
     */
    onUniformsChanged(detail) {
        // Update autocomplete with current uniforms
        this.updateAutocompleteUniforms();
        
        // Recompile if auto-compile is enabled
        if (this.components.controls.isAutoCompileEnabled()) {
            this.compileShaders();
        }
    }

    /**
     * Update autocomplete with current uniforms
     */
    updateAutocompleteUniforms() {
        if (this.components.codeEditor && this.components.uniformManager) {
            const uniforms = [];
            
            // Convert uniform map to array format expected by CodeEditor
            for (const [name, uniform] of this.components.uniformManager.uniforms) {
                uniforms.push({
                    name: name,
                    type: uniform.type,
                    builtin: this.components.uniformManager.builtinAssociations.get(name) || 'custom',
                    description: this.getUniformDescription(name, uniform)
                });
            }
            
            this.components.codeEditor.updateUniformCompletions(uniforms);
        }
    }

    /**
     * Get description for a uniform
     * @param {string} name - Uniform name
     * @param {Object} uniform - Uniform object
     * @returns {string} Description string
     */
    getUniformDescription(name, uniform) {
        const builtin = this.components.uniformManager.builtinAssociations.get(name);
        
        if (builtin && builtin !== 'custom') {
            switch (builtin) {
                case 'time': return 'Current animation time in seconds';
                case 'resolution': return 'Canvas resolution in pixels';
                case 'mouse': return 'Mouse position in screen coordinates';
                case 'lastFrame': return 'Previous frame texture for feedback effects';
                default: return `Built-in uniform: ${builtin}`;
            }
        }
        
        return `User-defined uniform of type ${uniform.type}`;
    }

    /**
     * Handle animation state changes
     * @param {Object} detail - Animation state details
     */
    onAnimationStateChanged(detail) {
        // Update time uniform UI buttons
        this.components.uniformManager.uniformUI.updateTimeButtons(detail.playing);
    }

    /**
     * Handle animation reset
     * @param {Object} detail - Animation reset details
     */
    onAnimationReset(detail) {
        // Animation reset is handled by the WebGLRenderer
        // This is just for any additional UI updates if needed
    }

    /**
     * Handle pan/zoom toggle
     * @param {Object} detail - Pan/zoom toggle details
     */
    onPanZoomToggled(detail) {
        if (this.components.renderer) {
            this.components.renderer.setPanZoomEnabled(detail.enabled);
        }
    }

    /**
     * Handle view reset request
     */
    onViewResetRequested() {
        if (this.components.renderer) {
            this.components.renderer.resetView();
        }
    }



    /**
     * Handle autosave toggle event
     * @param {boolean} enabled - Whether autosave is enabled
     */
    onAutosaveToggled(enabled) {
        this.settings.autosave.enabled = enabled;
        if (enabled) {
            this.startAutosave();
        } else {
            this.stopAutosave();
        }
    }

    /**
     * Handle autosave interval change event
     * @param {number} intervalMinutes - New autosave interval in minutes
     */
    onAutosaveIntervalChanged(intervalMinutes) {
        this.settings.autosave.intervalMinutes = intervalMinutes;
        if (this.settings.autosave.enabled) {
            this.stopAutosave();
            this.startAutosave();
        }
    }

    /**
     * Handle tab changes
     * @param {Object} detail - Tab change details
     */
    onTabChanged(detail) {
        // Focus the editor for the active tab
        this.components.codeEditor.focusEditor(detail.shaderType);
    }

    /**
     * Get current shader content
     * @returns {Object} Object with vertex and fragment shader content
     */
    getShaderContent() {
        return {
            vertex: this.components.codeEditor.getShaderContent('vertex'),
            fragment: this.components.codeEditor.getShaderContent('fragment')
        };
    }

    /**
     * Set shader content
     * @param {string} type - Shader type ('vertex' or 'fragment')
     * @param {string} content - Shader content
     */
    setShaderContent(type, content) {
        this.components.codeEditor.setShaderContent(type, content);
    }

    /**
     * Get renderer state
     * @returns {Object} Renderer state information
     */
    getRendererState() {
        return {
            animation: this.components.renderer.getAnimationState(),
            mousePosition: this.components.renderer.getMousePosition(),
            view: this.components.renderer.getViewState()
        };
    }

    /**
     * Get uniform manager
     * @returns {UniformManager} The uniform manager instance
     */
    getUniformManager() {
        return this.components.uniformManager;
    }

    /**
     * Get panel manager
     * @returns {PanelManager} The panel manager instance
     */
    getPanelManager() {
        return this.components.panelManager;
    }

    /**
     * Export editor state
     * @returns {Object} Exportable editor state
     */
    exportState() {
        return {
            shaders: this.getShaderContent(),
            uniforms: this.components.uniformManager.exportUniforms(),
            settings: this.settings,
            canvas: {
                width: this.settings.canvas.width,
                height: this.settings.canvas.height
            },
            rendererState: this.getRendererState()
        };
    }

    /**
     * Import editor state
     * @param {Object} state - Editor state to import
     */
    importState(state) {
        if (state.shaders) {
            if (state.shaders.vertex) {
                this.setShaderContent('vertex', state.shaders.vertex);
            }
            if (state.shaders.fragment) {
                this.setShaderContent('fragment', state.shaders.fragment);
            }
        }

        if (state.uniforms) {
            this.components.uniformManager.importUniforms(state.uniforms);
        }

        // Import canvas resolution
        if (state.canvas && state.canvas.width && state.canvas.height) {
            this.resizeCanvas(state.canvas.width, state.canvas.height);
        }

        // Recompile after importing
        setTimeout(() => {
            this.compileShaders();
        }, 100);
    }

    /**
     * Save shader code to file with file dialog
     * @param {string} saveType - Type of save: 'combined', 'fragment', or 'vertex'
     */
    async saveShaderCode(saveType = 'combined') {
        try {
            const fragmentShader = this.components.codeEditor.getShaderContent('fragment');
            const vertexShader = this.components.codeEditor.getShaderContent('vertex');
            
            let shaderContent;
            let fileName;
            let fileExtension;

            switch (saveType) {
                case 'fragment':
                    shaderContent = fragmentShader;
                    fileName = `fragment-shader-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
                    fileExtension = '.frag';
                    break;
                case 'vertex':
                    shaderContent = vertexShader;
                    fileName = `vertex-shader-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
                    fileExtension = '.vert';
                    break;
                case 'combined':
                default:
                    shaderContent = `// Fragment Shader
${fragmentShader}

// Vertex Shader
${vertexShader}`;
                    fileName = `shader-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
                    fileExtension = '.glsl';
                    break;
            }

            // Try to use File System Access API for modern browsers
            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: fileName + fileExtension,
                        types: [{
                            description: 'GLSL Shader files',
                            accept: {
                                'text/plain': ['.glsl', '.frag', '.vert', '.txt']
                            }
                        }]
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(shaderContent);
                    await writable.close();
                    
                    return;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return; // User cancelled
                    }
                    throw error;
                }
            }

            // Fallback to download for older browsers
            const dataBlob = new Blob([shaderContent], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = fileName + fileExtension;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
        } catch (error) {
            console.error('Failed to save shader code:', error);
            alert('Failed to save shader code: ' + error.message);
        }
    }

    /**
     * Export complete project to file
     */
    async exportProject() {
        try {
            const projectData = {
                version: "1.0",
                timestamp: new Date().toISOString(),
                shaders: {
                    vertex: this.components.codeEditor.getShaderContent('vertex'),
                    fragment: this.components.codeEditor.getShaderContent('fragment')
                },
                uniforms: await this.components.uniformManager.exportUniforms(),
                settings: {
                    autoCompile: this.components.controls.isAutoCompileEnabled(),
                    panZoom: this.components.controls.isPanZoomEnabled()
                },
                canvas: {
                    width: this.settings.canvas.width,
                    height: this.settings.canvas.height
                },
                view: this.components.renderer ? this.components.renderer.getViewState() : null
            };

            const dataStr = JSON.stringify(projectData, null, 2);
            const fileName = `shader-project-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

            // Try to use File System Access API for modern browsers
            if ('showSaveFilePicker' in window) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Shader Project files',
                            accept: {
                                'application/json': ['.json']
                            }
                        }]
                    });

                    const writable = await fileHandle.createWritable();
                    await writable.write(dataStr);
                    await writable.close();
                    
                    return;
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return; // User cancelled
                    }
                    throw error;
                }
            }

            // Fallback to download for older browsers
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
        } catch (error) {
            console.error('Failed to export project:', error);
            alert('Failed to export project: ' + error.message);
        }
    }

    /**
     * Load project from data
     * @param {Object} data - Project data to load
     */
    async loadProject(data) {
        try {
            if (!data.version) {
                throw new Error('Invalid project file format');
            }

            // Load shaders
            if (data.shaders) {
                if (data.shaders.vertex) {
                    this.setShaderContent('vertex', data.shaders.vertex);
                }
                if (data.shaders.fragment) {
                    this.setShaderContent('fragment', data.shaders.fragment);
                }
            }

            // Load uniforms (async due to texture restoration)
            if (data.uniforms) {
                await this.components.uniformManager.importUniforms(data.uniforms);
            }

            // Load settings
            if (data.settings) {
                if (data.settings.autoCompile !== undefined) {
                    this.components.controls.setAutoCompileEnabled(data.settings.autoCompile);
                }
                if (data.settings.panZoom !== undefined) {
                    this.components.controls.setPanZoomEnabled(data.settings.panZoom);
                    this.components.renderer.setPanZoomEnabled(data.settings.panZoom);
                }
            }

            // Load canvas resolution
            if (data.canvas && data.canvas.width && data.canvas.height) {
                this.resizeCanvas(data.canvas.width, data.canvas.height);
            }

            // Restore view state
            if (data.view && this.components.renderer) {
                if (data.view.offset) {
                    this.components.renderer.viewOffset = { ...data.view.offset };
                }
                if (data.view.zoom !== undefined) {
                    this.components.renderer.viewZoom = data.view.zoom;
                }
                // Update the transform after restoring view state
                if (this.components.renderer.updateCanvasTransform) {
                    this.components.renderer.updateCanvasTransform();
                }
            }

            // Recompile after loading
            setTimeout(() => {
                this.compileShaders();
            }, 100);

        } catch (error) {
            console.error('Failed to load project:', error);
            alert('Failed to load project: ' + error.message);
        }
    }

    /**
     * Load an example shader
     * @param {Object} detail - Example shader details
     */
    loadExampleShader(detail) {
        try {
            // Set the shader content in the editor
            this.setShaderContent(detail.type, detail.content);
            
            // Switch to the appropriate tab
            this.components.tabManager.switchToTab(detail.type);
            
            // Compile the shaders after a short delay
            setTimeout(() => {
                this.compileShaders();
            }, 100);
            
        } catch (error) {
            console.error('Failed to load example shader:', error);
            alert('Failed to load example shader: ' + error.message);
        }
    }

    /**
     * Create a uniform required by an example
     * @param {Object} uniformSpec - Uniform specification
     */
    createExampleUniform(uniformSpec) {
        try {
            // Check if uniform already exists
            if (this.components.uniformManager.uniforms.has(uniformSpec.name)) {
                return;
            }

            // Create the uniform
            const defaultValue = this.getDefaultValueForType(uniformSpec.type);
            const uniformData = {
                type: uniformSpec.type,
                value: defaultValue,
                default: false
            };
            
            // Add keyCode for keyState uniforms
            if (uniformSpec.builtin === 'keyState' && uniformSpec.keyCode) {
                uniformData.keyCode = uniformSpec.keyCode;
            }
            
            this.components.uniformManager.uniforms.set(uniformSpec.name, uniformData);

            // Set builtin association if specified
            if (uniformSpec.builtin) {
                this.components.uniformManager.builtinAssociations.set(uniformSpec.name, uniformSpec.builtin);
            }

            // Create UI for the uniform
            this.components.uniformManager.uniformUI.createUniformUI(
                uniformSpec.name,
                uniformSpec.type,
                defaultValue,
                false
            );

            // Refresh placeholder position
            this.components.uniformManager.refreshPlaceholder();

            // Notify about uniform change
            this.components.uniformManager.dispatchUniformsChanged();

        } catch (error) {
            console.error('Failed to create example uniform:', error);
        }
    }

    /**
     * Get default value for a uniform type
     * @param {string} type - The uniform type
     * @returns {*} The default value
     */
    getDefaultValueForType(type) {
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
     * Resize the canvas and update settings
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resizeCanvas(width, height) {
        try {
            // Validate dimensions
            width = Math.max(1, Math.min(4096, Math.round(width)));
            height = Math.max(1, Math.min(4096, Math.round(height)));

            // Update settings
            this.settings.canvas.width = width;
            this.settings.canvas.height = height;

            // Resize the renderer
            this.components.renderer.resize(width, height);

        } catch (error) {
            console.error('Failed to resize canvas:', error);
            alert('Failed to resize canvas: ' + error.message);
        }
    }

    /**
     * Take a screenshot of the current render
     */
    takeScreenshot() {
        try {
            const canvas = this.components.renderer.canvas;
            const dataURL = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `shader-screenshot-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error('Failed to take screenshot:', error);
            alert('Failed to take screenshot: ' + error.message);
        }
    }

    /**
     * Start recording video
     * @param {number} duration - Duration in seconds
     */
    startRecording(duration) {
        try {
            // Reset animation time to start recording from the beginning
            this.components.renderer.resetAnimation();
            
            const canvas = this.components.renderer.canvas;
            const stream = canvas.captureStream(30); // 30 FPS
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });
            
            this.recordedChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `shader-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                this.components.controls.setRecordingState(false);
            };
            
            this.mediaRecorder.start();
            this.components.controls.setRecordingState(true);
            
            // Auto-stop after specified duration
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.stopRecording();
                }
            }, duration * 1000);
            
        } catch (error) {
            console.error('Failed to start recording:', error);
            alert('Failed to start recording: ' + error.message);
            this.components.controls.setRecordingState(false);
        }
    }

    /**
     * Stop recording video
     */
    stopRecording() {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.components.controls.setRecordingState(false);
        }
    }

    /**
     * Update editor settings
     * @param {Object} newSettings - New settings to apply
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        // Update individual component settings
        if (newSettings.editor) {
            this.components.codeEditor.updateSettings(newSettings.editor);
        }

        if (newSettings.canvas) {
            this.components.renderer.resize(newSettings.canvas.width, newSettings.canvas.height);
        }
    }

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Start autosave functionality
     */
    startAutosave() {
        this.stopAutosave(); // Clear any existing timer
        
        if (!this.settings.autosave.enabled) {
            return;
        }

        const intervalMs = this.settings.autosave.intervalMinutes * 60 * 1000;
        this.autosaveTimer = setInterval(() => {
            this.performAutosave();
        }, intervalMs);

    }

    /**
     * Stop autosave functionality
     */
    stopAutosave() {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }

    /**
     * Perform autosave operation
     */
    async performAutosave() {
        try {
            const currentState = this.exportState();
            const stateString = JSON.stringify(currentState);
            
            // Create a simple hash to check if content has changed
            const stateHash = this.simpleHash(stateString);
            
            // Only save if content has changed
            if (stateHash === this.lastAutosaveHash) {
                return;
            }

            // Check localStorage size limit
            if (stateString.length > this.settings.autosave.maxStorageSize) {
                console.warn('Autosave skipped: Content too large for localStorage');
                return;
            }

            // Save to localStorage
            const autosaveData = {
                timestamp: new Date().toISOString(),
                state: currentState,
                hash: stateHash
            };

            localStorage.setItem(this.autosaveKey, JSON.stringify(autosaveData));
            this.lastAutosaveHash = stateHash;

            // Show notification if enabled
            if (this.settings.autosave.showNotifications) {
                this.showAutosaveNotification();
            }

        } catch (error) {
            console.error('Autosave failed:', error);
        }
    }

    /**
     * Show autosave notification
     * @param {string} message - Custom message to show
     */
    showAutosaveNotification(message = 'Autosaved') {
        // Create a simple notification element
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--accent-primary, #4a90e2);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10000;
            transition: opacity 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        `;

        document.body.appendChild(notification);

        // Remove notification after 2 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Check if autosaved data exists
     * @returns {boolean} True if autosaved data exists
     */
    hasAutosaveData() {
        try {
            const autosaveData = localStorage.getItem(this.autosaveKey);
            return autosaveData !== null;
        } catch (error) {
            console.error('Error checking autosave data:', error);
            return false;
        }
    }

    /**
     * Restore from autosave
     * @returns {boolean} True if restore was successful
     */
    async restoreFromAutosave() {
        try {
            const autosaveDataString = localStorage.getItem(this.autosaveKey);
            if (!autosaveDataString) {
                return false;
            }

            const autosaveData = JSON.parse(autosaveDataString);
            if (!autosaveData.state) {
                return false;
            }

            // Import the autosaved state
            await this.importState(autosaveData.state);
            this.lastAutosaveHash = autosaveData.hash;

            return true;
        } catch (error) {
            console.error('Failed to restore from autosave:', error);
            return false;
        }
    }

    /**
     * Clear autosave data
     */
    clearAutosaveData() {
        try {
            localStorage.removeItem(this.autosaveKey);
            this.lastAutosaveHash = null;
        } catch (error) {
            console.error('Error clearing autosave data:', error);
        }
    }

    /**
     * Simple hash function for content comparison
     * @param {string} str - String to hash
     * @returns {number} Simple hash value
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * Setup canvas filtering controls
     */
    setupCanvasFilteringControls() {
        const filterSelect = document.getElementById('canvasFilterSelect');
        
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                const event = new CustomEvent('canvasFilteringChanged', {
                    detail: { mode: e.target.value }
                });
                document.dispatchEvent(event);
            });

            // Set initial state based on renderer (if available)
            if (this.components.renderer && typeof this.components.renderer.getCanvasFiltering === 'function') {
                try {
                    const currentMode = this.components.renderer.getCanvasFiltering();
                    filterSelect.value = currentMode;
                } catch (error) {
                    console.warn('Could not get canvas filtering mode:', error);
                    // Use default value
                    filterSelect.value = 'nearest';
                }
            }
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Stop autosave before cleanup
        this.stopAutosave();
        
        // Clean up all components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });

        // Clear components
        this.components = {};
    }
} 
